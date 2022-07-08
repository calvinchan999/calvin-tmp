import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';

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
  closeAfterRefresh?: boolean;
}

export interface Modal {
  modal: string | null;
  modalHeader: string | null;
  isDisableClose?: boolean;
  metaData?: any;
  closeAfterRefresh?: boolean;
}

export interface DepartureWaypoint {
  x: number;
  y: number;
  name: string;
}

export enum TaskCompletionType {
  'RELEASE',
  'HOLD',
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  public currentMapBehaviorSubject$ = new BehaviorSubject<string>('');
  public currentMode$ = new Subject<string>();
  public currentManualStatus$ = new Subject<Boolean>();
  public currentMap$ = new Subject<string>();
  public currentPairingStatus$ = new BehaviorSubject<any>(null);
  public refresh$ = new Subject<boolean>();
  public loading$ = new Subject<boolean>();
  public response$ = new Subject<Response>();
  public isOpenModal$ = new Subject<Modal>();

  public departureWaypoint$ = new BehaviorSubject<DepartureWaypoint>(null);
  public taskCompletionType$ = new BehaviorSubject<any>(null);

  public reset$ = new Subject<number>();
  public timer$: Observable<any>;

  constructor() {
    this.currentMap$
      .pipe(
        tap((mapName) => {
          this.currentMapBehaviorSubject$.next(mapName);
        })
      )
      .subscribe();
  }
}
