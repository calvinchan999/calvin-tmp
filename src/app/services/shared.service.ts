import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

export interface ModalAction {
  topic: string;
  entry: any;
  payload?: any;
}

export interface Mode {
  mode: string;
}

// export interface Type {
//   type: "close-modal"
// }

export interface Response {
  type: 'normal' | 'warning';
  message: string;
  parentComponent?: any
}

export interface Modal {
  modal: string;
  modalHeader: string;
  isDisableClose?: boolean;
  payload?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  public currentMode$ = new BehaviorSubject<string>('');
  public currentMap$ = new BehaviorSubject<string>('');
  public refresh$ = new Subject<boolean>();
  public loading$ = new Subject<boolean>();
  public response$ = new Subject<Response>();
  // public isGoingDestination$ = new Subject<boolean>();
  // public isDynamicAction$ = new Subject<Type>();
  public isOpenModal$ = new Subject<Modal>();
  public userRole$ = new BehaviorSubject<string>('');
  constructor() {}

  _userRole(): Observable<any> {
    if (typeof localStorage.getItem('role') !== 'string' ||　!localStorage.getItem('role')) {
      localStorage.setItem('role', 'client');
      this.userRole$.next("client");
    } else if (localStorage.getItem('role') === 'client') {
      localStorage.setItem('role', 'admin');
      this.userRole$.next('admin');
    } else if (localStorage.getItem('role') === 'admin') {
      localStorage.setItem('role', 'client');
      this.userRole$.next('client');
    }
    return of(null);
  }
}
