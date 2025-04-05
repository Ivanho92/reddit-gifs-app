import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@/gifs/gif-list.page'),
    pathMatch: 'full',
  },
];
