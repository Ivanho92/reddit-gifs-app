import { APP_CONFIG } from '@core/injection-tokens';
import { FormControl } from '@angular/forms';
import { Gif } from './gif.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { RedditPost } from '@common/interfaces/reddit-post';
import { RedditResponse } from '@common/interfaces/reddit-response';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Subject,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  expand,
  map,
  startWith,
  switchMap, tap,
} from 'rxjs';

export interface GifsState {
  gifs: Gif[];
  error: string | null;
  loading: boolean;
  lastKnownGif: string | null;
}

@Injectable({ providedIn: 'root' })
export class GifService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(APP_CONFIG);

  searchFormControl = new FormControl<string>('');

  //region State
  private readonly state = signal<GifsState>({
    gifs: [],
    error: null,
    loading: true,
    lastKnownGif: null,
  });
  //endregion

  //region Selectors
  gifs = computed(() => this.state().gifs);
  error = computed(() => this.state().error);
  loading = computed(() => this.state().loading);
  lastKnownGif = computed(() => this.state().lastKnownGif);
  //endregion

  //region Sources
  readonly pagination$ = new Subject<string | null>();
  private readonly error$ = new Subject<string | null>();

  private readonly searchChanged$ = this.searchFormControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith('gifs'),
    map((subreddit) => (subreddit?.length ? subreddit : 'gifs')),
  );

  private readonly gifsLoaded$ = this.searchChanged$.pipe(
    switchMap((searchValue) =>
      this.pagination$.pipe(
        startWith(null),
        distinctUntilChanged(),
        tap(lastKnownGif => {
          console.log("------------------");
          console.log("pagination$ emited with value", lastKnownGif);
          console.log("state", this.state());
        }),
        concatMap((lastKnownGif) =>
          this.fetchGifsRecursively(searchValue, lastKnownGif, this.cfg.GIFS_PER_PAGE),
        ),
      ),
    ),
    tap((response) => {
      console.log("gifsLoaded$ completed. response: ", response);
    }),
  );
  //endregion

  constructor() {
    //region Reducers
    this.searchChanged$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.state.update((state) => ({
        ...state,
        loading: true,
        gifs: [],
        lastKnownGif: null,
      }));
    });

    this.gifsLoaded$.pipe(takeUntilDestroyed()).subscribe((response) => {
      return this.state.update((state) => ({
        ...state,
        gifs: [...state.gifs, ...response.gifs],
        loading: false,
        lastKnownGif: response.lastKnownGif,
      }))
      }
    );

    this.pagination$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.state.update((state) => ({
        ...state,
        loading: true,
      }));
    });

    this.error$.pipe(takeUntilDestroyed()).subscribe((error) =>
      this.state.update((state) => ({
        ...state,
        error,
      })),
    );
    //endregion
  }

  //region Methods
  private fetchGifsRecursively(
    searchValue: string,
    lastKnownGif: string | null,
    gifsPerPage: number
  ) {
    console.log("fetchGifsRecursively", lastKnownGif)
    // if (lastKnownGif && lastKnownGif === this.lastKnownGif()) return EMPTY;

    return this.fetchGifs(
      searchValue,
      lastKnownGif,
      gifsPerPage,
    ).pipe(
      // tap(() => {}),
      // tap(posts => console.log(posts)),
      // tap(() => console.log(this.lastKnownGif())),

      // A single request might not give enough valid gifs
      // as not every post is a valid gif.
      // Keep fetching more data until we do have enough for a page.
      expand((response, index) => {
        const { gifs, gifsRequired, lastKnownGif } = response;
        const remainingGifsToFetch = gifsRequired - gifs.length;
        const maxAttempts = 1;

        const shouldKeepTrying =
          remainingGifsToFetch > 0 &&
          index < maxAttempts &&
          lastKnownGif !== null;

        if (shouldKeepTrying) {
          console.log("trying another time... try # ", index+2);
          return this.fetchGifs(searchValue, lastKnownGif, remainingGifsToFetch)
        } else {
          return EMPTY
        }

        // return shouldKeepTrying
        //   ? this.fetchGifs(searchValue, lastKnownGif, remainingGifsToFetch)
        //   : EMPTY;
      }),
    );
  }

  private fetchGifs(
    searchValue: string,
    after: string | null,
    gifsRequired: number,
  ) {
    return this.http.get<RedditResponse>(`https://www.reddit.com/r/gifs/search.json`, {
      params: {
        q: searchValue ?? 'hot',
        type: 'media',
        limit: 100,
        ...(after && { after }), // only adds 'after' if truthy
      },
    })
      .pipe(
        // tap(response => console.log(response)),
        catchError((err) => {
          this.handleError(err);
          return EMPTY;
        }),
        map((response) => {
          const posts = response.data.children;
          console.log(posts.length)
          let gifs = this.convertRedditPostsToGifs(posts);
          let lastKnownGif = posts.length
            ? posts.at(-1)!.data.name
            : after;

          return {
            gifs,
            gifsRequired,
            lastKnownGif,
          };
        }),
      );
  }

  private handleError(err: HttpErrorResponse) {
    // Handle specific error cases
    if (err.status === 404 && err.url) {
      this.error$.next(`Failed to load gifs for /r/${err.url.split('/')[4]}`);
      return;
    }

    // Generic error if no cases match
    this.error$.next(err.statusText);
  }

  private convertRedditPostsToGifs(posts: RedditPost[]) {
    return posts
      .map((post) => ({
        src: this.getBestSrcForGif(post),
        author: post.data.author,
        name: post.data.name,
        permalink: post.data.permalink,
        title: post.data.title,
        thumbnail: this.getThumbnailForGif(post, this.cfg.DEFAULT_THUMBNAILS),
        comments: post.data.num_comments,
      }))
      .filter((post): post is Gif => post.src !== null);
  }

  private getBestSrcForGif(post: RedditPost) {
    // If the source is in .mp4 format, leave unchanged
    if (post.data.url.indexOf('.mp4') > -1) {
      return post.data.url;
    }

    // If the source is in .gifv or .webm formats, convert to .mp4 and return
    if (post.data.url.indexOf('.gifv') > -1) {
      return post.data.url.replace('.gifv', '.mp4');
    }

    if (post.data.url.indexOf('.webm') > -1) {
      return post.data.url.replace('.webm', '.mp4');
    }

    // If the URL is not .gifv or .webm, check if media or secure media is available
    if (post.data.secure_media?.reddit_video) {
      return post.data.secure_media.reddit_video.fallback_url;
    }

    if (post.data.media?.reddit_video) {
      return post.data.media.reddit_video.fallback_url;
    }

    // If media objects are not available, check if a preview is available
    if (post.data.preview?.reddit_video_preview) {
      return post.data.preview.reddit_video_preview.fallback_url;
    }

    // No useable formats available
    return null;
  }

  private getThumbnailForGif(post: RedditPost, defaultThumbnails: string[]) {
    const thumbnail = post.data.thumbnail;
    const modifiedThumbnail = defaultThumbnails.includes(thumbnail)
      ? `/${thumbnail}.png`
      : thumbnail;

    const validThumbnail =
      modifiedThumbnail.endsWith('.jpg') || modifiedThumbnail.endsWith('.png');

    return validThumbnail ? modifiedThumbnail : `/default.png`;
  }
  //endregion
}
