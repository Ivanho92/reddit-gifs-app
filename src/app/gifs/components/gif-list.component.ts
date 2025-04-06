import { Component, input } from '@angular/core';
import { Gif } from '../shared/gif.model';
import { GifPlayerComponent } from './gif-player.component';

@Component({
  standalone: true,
  selector: 'app-gif-list',
  template: `
    @for (gif of gifs(); track gif.permalink) {
      <div>
        <app-gif-player [src]="gif.src" [thumbnail]="gif.thumbnail" />
        <div>
          <span>{{ gif.title }}</span>
          <a [href]="'https://reddit.com/' + gif.permalink"></a>
        </div>
      </div>
    }
  `,
  imports: [GifPlayerComponent],
  styles: ``,
})
export class GifListComponent {
  gifs = input.required<Gif[]>();
}
