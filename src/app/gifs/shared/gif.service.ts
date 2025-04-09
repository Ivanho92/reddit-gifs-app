import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { RedditPost } from '@common/interfaces/reddit-post';
import { RedditResponse } from '@common/interfaces/reddit-response';
import { ErrorService } from '@core/error.service';
import { APP_CONFIG } from '@core/injection-tokens';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  expand,
  map,
  Observable,
  of,
  reduce,
  startWith,
} from 'rxjs';
import { Gif } from './gif.model';

interface FetchResponse {
  gifs: Gif[];
  lastKnownGif: string | null | undefined;
  gifsRequired: number;
}

@Injectable({ providedIn: 'root' })
export class GifService {
  private readonly cfg = inject(APP_CONFIG);
  private readonly errorService = inject(ErrorService);
  private readonly http = inject(HttpClient);

  searchFormControl = new FormControl<string>('');

  //region Sources
  private readonly searchChanged$ = this.searchFormControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith('gifs'),
    map((searchQuery) => (searchQuery?.length ? searchQuery.trim() : 'gifs')),
  );
  searchValue = toSignal(this.searchChanged$, { initialValue: '' });

  paginateAfter = linkedSignal({
    source: this.searchValue,
    computation: () => undefined as string | null | undefined,
  });

  gifsLoaded = rxResource({
    request: () => ({
      searchValue: this.searchValue(),
      paginateAfter: this.paginateAfter(),
    }),
    loader: ({ request }) => {
      const { searchValue, paginateAfter } = request;
      return paginateAfter === null
        ? of({
            gifs: [],
            lastKnownGif: null,
            gifsRequired: this.cfg.MIN_GIFS_PER_PAGE,
          })
        : this.fetchGifsRecursively(
            searchValue,
            paginateAfter,
            this.cfg.MIN_GIFS_PER_PAGE,
          );
    },
    defaultValue: {
      gifs: [],
      lastKnownGif: undefined,
      gifsRequired: this.cfg.MIN_GIFS_PER_PAGE,
    },
  });

  gifs = linkedSignal<FetchResponse, Gif[]>({
    source: this.gifsLoaded.value,
    computation: (source, previous) =>
      !previous ? [] : [...previous.value, ...source.gifs],
  });
  //endregion

  constructor() {
    effect(() => {
      this.searchValue();
      this.gifs.set([]);
    });
  }

  //region Methods
  private fetchGifsRecursively(
    searchValue: string,
    lastKnownGif: string | null | undefined,
    gifsPerPage: number,
  ): Observable<FetchResponse> {
    return this.fetchGifs(searchValue, lastKnownGif, gifsPerPage).pipe(
      // A single request might not give enough valid gifs
      // as not every post is a valid gif.
      // Keep fetching more data until we do have enough for a page.
      expand((response, index) => {
        const { gifs, gifsRequired, lastKnownGif } = response;
        const remainingGifsToFetch = gifsRequired - gifs.length;
        const maxAttempts = this.cfg.RECURSIVE_FETCH_MAX_ATTEMPTS;

        const shouldKeepTrying =
          remainingGifsToFetch > 0 &&
          index < maxAttempts &&
          lastKnownGif !== null;

        return shouldKeepTrying
          ? this.fetchGifs(searchValue, lastKnownGif, remainingGifsToFetch)
          : EMPTY;
      }),
      reduce((acc, value) => ({
        gifs: [...acc.gifs, ...value.gifs],
        gifsRequired: value.gifsRequired,
        lastKnownGif: value.lastKnownGif,
      })),
    );
  }

  private fetchGifs(
    searchValue: string,
    after: string | null | undefined,
    gifsRequired: number,
  ): Observable<FetchResponse> {
    return this.http
      .get<RedditResponse>(`https://www.reddit.com/r/gifs/search.json`, {
        params: {
          q: searchValue,
          type: 'posts',
          sort: 'relevance',
          limit: this.cfg.GIFS_PER_FETCH_LIMIT,
          ...(after && { after }), // only adds 'after' if truthy
        },
      })
      .pipe(
        catchError((err) => {
          this.handleError(err);
          return EMPTY;
        }),
        map((response) => {
          const posts = response.data.children;
          const gifs = this.convertRedditPostsToGifs(posts);
          const lastKnownGif = posts.length ? posts.at(-1)!.data.name : null;

          return {
            gifs,
            gifsRequired,
            lastKnownGif,
          };
        }),
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 404 && error.url) {
      this.errorService.addError(
        `Failed to load gifs for /r/${error.url.split('/')[4]}`,
      );
      return;
    }

    if (error.status === 429) {
      this.errorService.addError(
        `Too many requests were sent to Reddit. Please try again in a few minutes.`,
      );
      return;
    }

    this.errorService.addError(
      `Failed to load gifs (${error.status} ${error.statusText})`,
    );
  }

  private convertRedditPostsToGifs(posts: RedditPost[]): Gif[] {
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

  private getBestSrcForGif(post: RedditPost): string | null {
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

  private getThumbnailForGif(
    post: RedditPost,
    defaultThumbnails: string[],
  ): string {
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
