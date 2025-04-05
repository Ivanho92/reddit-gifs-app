import { InjectionToken } from '@angular/core';
import Settings from './settings';

export const WINDOW = new InjectionToken<Window>('The window object', {
  factory: () => window,
});

export const APP_CONFIG = new InjectionToken<typeof Settings>(
  'Application Settings',
  {
    factory: () => Settings,
  },
);
