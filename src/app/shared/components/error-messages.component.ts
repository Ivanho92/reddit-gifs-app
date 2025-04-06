import { Component, inject } from '@angular/core';
import { Message } from 'primeng/message';
import { ErrorService } from '@core/error.service';

@Component({
  selector: 'app-error-messages',
  imports: [Message],
  template: `
    <div class="flow" style="--flow-space: 0.5em">
      @for (error of errorService.errors(); track error.uuid) {
        <p-message
          severity="error"
          closable
          (onClose)="errorService.onRemoveError(error.uuid)"
        >
          {{ error.message }}
        </p-message>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-block: 0.5em;
    }

    :host ::ng-deep p-message {
      display: block;
    }
  `,
})
export class ErrorMessagesComponent {
  errorService = inject(ErrorService);
}
