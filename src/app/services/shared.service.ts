import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, timer } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

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
}

export interface Modal {
  modal: string | null;
  modalHeader: string | null;
  isDisableClose?: boolean;
  payload?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  public currentMode$ = new Subject<string>();
  public currentMap$ = new Subject<string>();
  public currentPairingStatus$ = new BehaviorSubject<any>(null);
  public refresh$ = new Subject<boolean>();
  public loading$ = new Subject<boolean>();
  public response$ = new Subject<Response>();
  public isOpenModal$ = new Subject<Modal>();

  public reset$ = new Subject<number>();
  public timer$: Observable<any>;

  constructor() {
  // @todo check connection
    // this.timer$ = this.reset$.pipe(
    //   startWith(0),
    //   switchMap(() => timer(0, 10000)) // Set a timer to check the mqtt connection, and reset the timer if the mqtt battery topic has posted some data.
    // );
  }

  // _userRole(): Observable<any> {
  //   if (typeof localStorage.getItem('role') !== 'string' ||　!localStorage.getItem('role')) {
  //     localStorage.setItem('role', 'client');
  //     this.userRole$.next("client");
  //   } else if (localStorage.getItem('role') === 'client') {
  //     localStorage.setItem('role', 'admin');
  //     this.userRole$.next('admin');
  //   } else if (localStorage.getItem('role') === 'admin') {
  //     localStorage.setItem('role', 'client');
  //     this.userRole$.next('client');
  //   }
  //   return of(null);
  // }
}
