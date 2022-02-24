import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpStatusService {
  private requestInFlight$: BehaviorSubject<any>;

  constructor() {
    this.requestInFlight$ = new BehaviorSubject(false);
  }

  setHttpStatus(inFlight: boolean, errorCode?: any, errorMsg?: string) {
    this.requestInFlight$.next({ inFlight, errorCode, errorMsg });
  }

  getHttpStatus(): Observable<boolean> {
    return this.requestInFlight$.asObservable();
  }
}
