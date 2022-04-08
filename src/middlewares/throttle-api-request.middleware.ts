import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ThrottleStorageService } from '../services/throttle-storage-service';
import { first, switchMap } from 'rxjs';

@Injectable()
export class ThrottleApiRequestMiddleware implements NestMiddleware {
  constructor(
    private readonly throttleStorageService: ThrottleStorageService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const oneMinute = 60;
    const maxRequestsPerMinute = 30;
    this.throttleStorageService
      .addRecord(req.ip, oneMinute)
      .pipe(
        first(),
        switchMap(() =>
          this.throttleStorageService.getRecord(req.ip).pipe(first()),
        ),
      )
      .subscribe((count) => {
        if (count <= maxRequestsPerMinute) {
          req.next();
          return;
        } else {
          res.status(HttpStatus.TOO_MANY_REQUESTS).json({});
          return;
        }
      });
  }
}
