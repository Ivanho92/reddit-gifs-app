import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';

@Component({
  standalone: true,
  selector: 'app-gif-search',
  template: `
    <input
      pInputText
      placeholder="Search..."
      type="text"
      [formControl]="searchFormControl()"
    />
  `,
  imports: [InputText, ReactiveFormsModule],
  styles: ``,
})
export class GifSearchComponent {
  searchFormControl = input.required<FormControl>();
}
