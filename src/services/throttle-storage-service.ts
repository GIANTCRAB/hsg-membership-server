import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ThrottleStorageInterface } from './throttle-storage.interface';
import { BehaviorSubject, first, map, Observable } from 'rxjs';

@Injectable()
export class ThrottleStorageService
  implements ThrottleStorageInterface, OnApplicationShutdown
{
  private readonly _storedTiming: BehaviorSubject<
    Record<string, NodeJS.Timeout[]>
  > = new BehaviorSubject<Record<string, NodeJS.Timeout[]>>({});

  addRecord(key: string, secondsTtl: number): Observable<void> {
    return this._storedTiming.pipe(
      first(),
      map((storedTimings) => {
        const milliSecondsTtl = secondsTtl * 1000;
        const timer = setTimeout(() => {
          clearTimeout(timer);
          storedTimings[key] = storedTimings[key].filter(
            (result) => result != timer,
          );
          this._storedTiming.next(storedTimings);
        }, milliSecondsTtl);

        if (!storedTimings[key]) {
          storedTimings[key] = [];
        }
        storedTimings[key].push(timer);
        this._storedTiming.next(storedTimings);
      }),
    );
  }

  getRecord(key: string): Observable<number> {
    return this._storedTiming.pipe(
      map((storedTimings) =>
        storedTimings[key] ? storedTimings[key].length : 0,
      ),
    );
  }

  resetAllRecords(): void {
    const storedTimings = this._storedTiming.value;
    for (const storedTimingKey in storedTimings) {
      storedTimings[storedTimingKey].forEach((storedTiming) => {
        clearTimeout(storedTiming);
      });
    }
    this._storedTiming.next({});
  }

  onApplicationShutdown(signal?: string): any {
    this.resetAllRecords();
  }
}
