import { Component, input } from '@angular/core';
import { DarkModeSwitchComponent } from '@common/components/dark-mode-switch.component';
import { ErrorMessagesComponent } from '@common/components/error-messages.component';
import { FormControl } from '@angular/forms';
import { GifSearchComponent } from '@/gifs/components/gif-search.component';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  standalone: true,
  selector: 'app-gif-list-header',
  template: `
    <header class="text-center">
      <div class="wrapper">
        <app-error-messages />

        <div class="even-columns space-between align-items-center">
          <div style="width: 25px">
            @if (isLoadingGifs()) {
              <p-progress-spinner
                ariaLabel="loading"
                strokeWidth="4"
                animationDuration=".5s"
                [style]="{ width: '25px', height: '25px' }"
              />
            }
          </div>
          <div class="stack">
            <div class="cluster">
              <h1>Reddit Gifs</h1>
              <a
                href="https://github.com/Ivanho92/reddit-gifs-app"
                target="_blank"
              >
                <img
                  src="/github-logo.svg"
                  alt=""
                  height="20"
                  width="20"
                  class="dark-mode-inverse"
                />
              </a>
            </div>
            <app-gif-search [searchFormControl]="searchFormControl()" />
          </div>
          <app-dark-mode-switch />
        </div>
      </div>
    </header>
  `,
  imports: [
    ErrorMessagesComponent,
    GifSearchComponent,
    ProgressSpinner,
    DarkModeSwitchComponent,
  ],
  styles: `
    header {
      position: fixed;
      z-index: 1;
      top: 0;
      width: 100%;
      background: Canvas;
      padding-block-end: 1em;
      border-bottom: 1px solid light-dark(lightgray, #313131);
    }

    .wrapper {
      position: relative;
    }
  `,
})
export class GifListHeaderComponent {
  searchFormControl = input.required<FormControl>();
  isLoadingGifs = input.required<boolean>();
}
