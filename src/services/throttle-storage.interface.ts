import { Observable } from 'rxjs';

export interface ThrottleStorageInterface {
  getRecord(key: string): Observable<number>;
  addRecord(key: string, secondsTtl: number): Observable<void>;
}
