import { Component, inject } from '@angular/core';
import { GifListComponent } from './components/gif-list.component';
import { GifListHeaderComponent } from '@/gifs/components/gif-list-header.component';
import { GifService } from './shared/gif.service';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  selector: 'app-gif-list-page',
  template: `
    <app-gif-list-header
      [searchFormControl]="gifService.searchFormControl"
      [isLoadingGifs]="gifService.loading()"
    />

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
  `,
  imports: [GifListComponent, InfiniteScrollDirective, GifListHeaderComponent],
  styles: ``,
})
export default class GifListPage {
  gifService = inject(GifService);
}
