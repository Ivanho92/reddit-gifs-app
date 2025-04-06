import { ProgressSpinner } from 'primeng/progressspinner';
import { Subject, fromEvent, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';

interface GifPlayerState {
  playing: boolean;
  status: 'initial' | 'loading' | 'loaded';
}

@Component({
  standalone: true,
  selector: 'app-gif-player',
  template: `
    @if (status() === 'loading') {
      <p-progress-spinner
        ariaLabel="loading"
        strokeWidth="4"
        styleClass="center-absolute"
        [style]="{ width: '50px', height: '50px' }"
      />
    }
    <video
      (click)="togglePlay$.next()"
      (keydown.enter)="togglePlay$.next()"
      #gifPlayer
      tabindex="0"
      playsinline
      preload="none"
      [poster]="thumbnail()"
      [loop]="true"
      [muted]="true"
      [src]="src()"
    ></video>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    video {
      display: block;
      max-height: 300px;
      width: 100%;
      background: black;
      cursor: pointer;
    }
  `,
  imports: [ProgressSpinner],
})
export class GifPlayerComponent {
  src = input.required<string>();
  thumbnail = input.required<string>();

  videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('gifPlayer');
  videoElement$ = toObservable(this.videoElement);

  //region State
  state = signal<GifPlayerState>({
    playing: false,
    status: 'initial',
  });
  //endregion

  //region Selectors
  playing = computed(() => this.state().playing);
  status = computed(() => this.state().status);
  //endregion

  //region Sources
  togglePlay$ = new Subject<void>();

  videoLoadStart$ = this.togglePlay$.pipe(
    switchMap(() => this.videoElement$),
    switchMap(({ nativeElement }) => fromEvent(nativeElement, 'loadstart')),
  );

  videoLoadComplete$ = this.videoElement$.pipe(
    switchMap(({ nativeElement }) => fromEvent(nativeElement, 'loadeddata')),
  );
  //endregion

  constructor() {
    //region Reducers
    this.videoLoadStart$
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.state.update((state) => ({ ...state, status: 'loading' })),
      );

    this.videoLoadComplete$
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.state.update((state) => ({ ...state, status: 'loaded' })),
      );

    this.togglePlay$
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.state.update((state) => ({ ...state, playing: !state.playing })),
      );
    //endregion

    // effects
    effect(() => {
      const { nativeElement: video } = this.videoElement();
      const playing = this.playing();
      const status = this.status();

      if (!video) return;

      if (playing && status === 'initial') {
        video.load();
      }

      if (status === 'loaded') {
        playing ? video.play() : video.pause();
      }
    });
  }
}
