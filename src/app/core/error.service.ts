import { Injectable, signal } from '@angular/core';
import { v4 as uuid } from 'uuid';

interface AppError {
  uuid: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  errors = signal<AppError[]>([]);

  addError(message: string) {
    this.errors.update((prevState) => [
      ...prevState,
      { uuid: uuid(), message },
    ]);
  }

  onRemoveError(uuid: string) {
    this.errors().filter((err) => err.uuid === uuid);
  }
}
