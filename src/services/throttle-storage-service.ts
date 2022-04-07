import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ThrottleStorageInterface } from './throttle-storage.interface';
import { defer, Observable, of } from 'rxjs';

@Injectable()
export class ThrottleStorageService
  implements ThrottleStorageInterface, OnApplicationShutdown
{
  private _storedTiming: Record<string, NodeJS.Timeout[]> = {};

  addRecord(key: string, secondsTtl: number): Observable<any> {
    return defer(() => {
      const milliSecondsTtl = secondsTtl * 1000;
      const timer = setTimeout(() => {
        clearTimeout(timer);
        const listOfStoredTiming = this._storedTiming[key];
        this._storedTiming[key] = listOfStoredTiming.filter(
          (result) => result != timer,
        );
      }, milliSecondsTtl);

      return undefined;
    });
  }

  getRecord(key: string): Observable<number> {
    return of(this._storedTiming[key].length);
  }

  onApplicationShutdown(signal?: string): any {
    for (const storedTimingKey in this._storedTiming) {
      this._storedTiming[storedTimingKey].forEach((storedTiming) => {
        clearTimeout(storedTiming);
      });
    }
  }
}
