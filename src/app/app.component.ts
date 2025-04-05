import { Component } from '@angular/core';
import { ErrorMessagesComponent } from '@common/components/error-messages.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ErrorMessagesComponent],
  template: `
    <app-error-messages />
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
