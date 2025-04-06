import { Component, input } from '@angular/core';
import { GifPlayerComponent } from './gif-player.component';

@Component({
  standalone: true,
  selector: 'app-gif-item',
  template: `
    <div class="gif-item">
      <header [title]="title()" class="text-overflow-ellipsis">
        <span>{{ title() }}</span>
      </header>
      <app-gif-player [src]="src()" [thumbnail]="thumbnail()" />

      <a
        [href]="'https://reddit.com/' + permalink()"
        [attr.aria-label]="'View post on Reddit: ' + title()"
        title="View post on Reddit"
        class="gif-reddit-link"
        target="_blank"
      >
        <img src="/reddit-logo.svg" alt="" height="20" width="20" />
      </a>
    </div>
  `,
  imports: [GifPlayerComponent],
  styles: `
    :host {
      display: inline-block;
    }

    .gif-item {
      position: relative;

      color-scheme: dark;
      background: Canvas;
      color: CanvasText;

      border: 1px solid #313131;
      border-radius: 7px;
      overflow: hidden;

      header {
        padding: 0.5em 0.75em;
      }
    }

    .gif-reddit-link {
      position: absolute;
      bottom: 0.5em;
      right: 1em;

      opacity: 0.5;
      transition: opacity 100ms ease-in-out;

      &:hover,
      &:focus-visible {
        opacity: 1;
      }
    }
  `,
})
export class GitItemComponent {
  permalink = input.required<string>();
  src = input.required<string>();
  thumbnail = input.required<string>();
  title = input.required<string>();
}
