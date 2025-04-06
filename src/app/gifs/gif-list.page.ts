import { Component, inject } from '@angular/core';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ProgressSpinner } from 'primeng/progressspinner';
import { GifListComponent } from './components/gif-list.component';
import { GifService } from './shared/gif.service';
import { GifSearchComponent } from './components/gif-search.component';

@Component({
  standalone: true,
  selector: 'app-gif-list-page',
  template: `
    <div style="position: fixed; top: 0; right: 0;">{{ gifService.loading() }}</div>

    <app-gif-search [searchFormControl]="gifService.searchFormControl" />

    @if (gifService.gifs().length) {
      <app-gif-list
        [gifs]="gifService.gifs()"
        infiniteScroll
        (scrolled)="gifService.pagination$.next(gifService.lastKnownGif())"
        [infiniteScrollDisabled]="gifService.loading()"
      />
    } @else if (!gifService.loading()) {
      <p>Can't find any gifs 🤷</p>
    }

    @if (gifService.loading()) {
      <p-progress-spinner ariaLabel="loading" />
    }
  `,
  imports: [
    GifListComponent,
    GifSearchComponent,
    InfiniteScrollDirective,
    ProgressSpinner,
  ],
  styles: ``,
})
export default class GifListPage {
  gifService = inject(GifService);
}
