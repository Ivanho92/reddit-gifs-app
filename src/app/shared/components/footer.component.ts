import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: ` <footer class="wrapper">Footer</footer> `,
  styles: `
    :host {
      display: block;
      background: lightgrey;
      position: fixed;
      bottom: 0;
      width: 100%;
    }
  `,
})
export class FooterComponent {}
