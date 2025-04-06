import { Component, input } from '@angular/core';
import { Gif } from '../shared/gif.model';
import { GitItemComponent } from '@/gifs/components/gif-item.component';

@Component({
  standalone: true,
  selector: 'app-gif-list',
  template: `
    <div class="[ responsive-grid ] [ wrapper ]">
      @for (gif of gifs(); track gif.permalink) {
        <app-gif-item
          [src]="gif.src"
          [title]="gif.title"
          [permalink]="gif.permalink"
          [thumbnail]="gif.thumbnail"
        />
      }
    </div>
  `,
  imports: [GitItemComponent],
  styles: `
    :host {
      display: block;
      margin-block-start: 8rem;
      margin-block-end: 1rem;
    }

    .responsive-grid {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
  `,
})
export class GifListComponent {
  gifs = input.required<Gif[]>();
}
