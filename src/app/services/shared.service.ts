import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalAction {
  topic: string;
  entry: any;
  payload?: any;
}

export interface Mode {
  mode: string;
}

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
export type WaypointPageCategory = 'list' | 'map';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  public currentMode$ = new BehaviorSubject<string>('');
  public currentMap$ = new BehaviorSubject<string>('');
  public refresh$ = new Subject<boolean>();
  public loading$ = new Subject<boolean>();
  public response$ = new Subject<Response>();
  public isOpenModal$ = new Subject<Modal>();

  public reset$ = new Subject<number>();
  public timer$: Observable<any>;

  public waypointListPageMode$ = new BehaviorSubject<WaypointPageCategory>(
    'list'
  );

  constructor() {}
}
