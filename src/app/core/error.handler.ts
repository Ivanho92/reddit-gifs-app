import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject } from '@angular/core';
import { ErrorService } from '@core/error.service';

export class AppErrorHandler implements ErrorHandler {
  private readonly errorService = inject(ErrorService);

  handleError(error: unknown) {
    console.error(error);

    if (error instanceof HttpErrorResponse) {
      this.errorService.addError(error.message);
    }
  }
}
