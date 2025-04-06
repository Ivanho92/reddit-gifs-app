import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WINDOW } from '@core/injection-tokens';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { fromEvent, map, merge, startWith, tap } from 'rxjs';

@Component({
  selector: 'app-dark-mode-switch',
  imports: [ToggleSwitch, ReactiveFormsModule, NgClass],
  template: `
    <p-toggleswitch [formControl]="switchFormControl" aria-hidden="true">
      <ng-template #handle>
        <i
          style="font-size: x-small"
          [ngClass]="['pi', switchFormControl.value ? 'pi-moon' : 'pi-sun']"
        ></i>
      </ng-template>
    </p-toggleswitch>
  `,
})
export class DarkModeSwitchComponent {
  private readonly window = inject(WINDOW);

  protected readonly switchFormControl = new FormControl<boolean>(false);

  switchValueChanged$ = this.switchFormControl.valueChanges;

  windowColorSchemeChanged$ = fromEvent<MediaQueryList>(
    this.window.matchMedia('(prefers-color-scheme: dark)'),
    'change',
  ).pipe(
    startWith(this.window.matchMedia('(prefers-color-scheme: dark)')),
    map((list: MediaQueryList) => list.matches),
  );

  darkModeChanged$ = merge(
    this.switchValueChanged$,
    this.windowColorSchemeChanged$,
  );

  constructor() {
    this.darkModeChanged$.pipe(takeUntilDestroyed()).subscribe((isDarkMode) => {
      const element = document.querySelector('html');
      if (isDarkMode) element!.classList.add('dark-mode');
      else element!.classList.remove('dark-mode');
      this.switchFormControl.setValue(isDarkMode, { emitEvent: false });
    });
  }
}
