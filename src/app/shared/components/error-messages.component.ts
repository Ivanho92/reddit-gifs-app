import { Component, inject } from '@angular/core';
import { Message } from 'primeng/message';
import { ErrorService } from '@core/error.service';

@Component({
  selector: 'app-error-messages',
  imports: [Message],
  template: `
    @for (error of errorService.errors(); track error.uuid) {
      <p-message
        severity="error"
        closable
        (onClose)="errorService.onRemoveError(error.uuid)"
      >
        {{ error.message }}
      </p-message>
    }
  `,
})
export class ErrorMessagesComponent {
  errorService = inject(ErrorService);
}
