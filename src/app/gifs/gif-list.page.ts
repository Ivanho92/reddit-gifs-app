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
      [isLoadingGifs]="gifService.gifsLoaded.isLoading()"
    />

    @if (gifService.gifs().length) {
      <app-gif-list
        [gifs]="gifService.gifs()"
        infiniteScroll
        (scrolled)="gifService.paginateAfter.set(gifService.gifsLoaded.value().lastKnownGif)"
        [infiniteScrollDisabled]="gifService.gifsLoaded.isLoading()"
      />
    } @else if (!gifService.gifsLoaded.isLoading()) {
      <p>Can't find any gifs 🤷</p>
    }
  `,
  imports: [GifListComponent, InfiniteScrollDirective, GifListHeaderComponent],
  styles: ``,
})
export default class GifListPage {
  gifService = inject(GifService);
}
