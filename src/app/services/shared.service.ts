import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, timer } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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
  type: 'normal' | 'warning' | 'broadcast';
  message: string;
  closeAfterRefresh?: boolean;
}

export interface Modal {
  modal: string | null;
  modalHeader: string | null;
  isDisableClose?: boolean;
  metaData?: any; // todo
  robotId?: string;
  closeAfterRefresh?: boolean;
}

export interface DepartureWaypoint {
  x: number;
  y: number;
  name: string;
}

export enum TaskCompletionType {
  'RELEASE',
  'HOLD'
}

export enum LocalizationType {
  'LIST',
  'MAP'
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public mqBrokerConnection = new BehaviorSubject<boolean>(false);
  public currentRobotId = new BehaviorSubject<string>('');
  public currentMapBehaviorSubject$ = new BehaviorSubject<string>('');
  public currentMode$ = new Subject<string>();
  public currentManualStatus$ = new Subject<Boolean>();
  public currentMap$ = new Subject<string>();
  public currentPairingStatus$ = new BehaviorSubject<any>(null);
  public refresh$ = new Subject<boolean>();
  public loading$ = new Subject<boolean>();
  public response$ = new Subject<Response>();
  public isOpenModal$ = new Subject<Modal>();
  public isClosedModal$ = new Subject<String>();

  public departureWaypointSubject = new Subject<DepartureWaypoint>();
  // public taskCompletionType$ = new BehaviorSubject<any>(null);

  public reset$ = new Subject<number>();
  public timer$: Observable<any> = EMPTY;

  public localizationType$ = new BehaviorSubject<LocalizationType>(
    LocalizationType.LIST
  );

  public isRobotPairingPayloadBehaviorSubject = new BehaviorSubject<Modal>(
    null
  );

  public isRobotHeldBehaviorSubject = new BehaviorSubject<boolean>(false);

  public robotIdBahaviorSubject = new BehaviorSubject<String>(null);

  public arcsModeBahaviorSubject = new BehaviorSubject<boolean>(false);

  public poseDeviationConnectionBahaviorSubject = new BehaviorSubject<boolean>(
    false
  );

  public currentPageTitleEvent = new Subject<string>();
  public currentPageTitleEvent$ = this.currentPageTitleEvent.asObservable();

  public batterySubject = new Subject<any>();

  public robotTypeBahaviorSubject = new BehaviorSubject<string>("");

  public mapMateData = new BehaviorSubject<any>(null);

  constructor() {
    this.currentMap$
      .pipe(
        tap(mapName => {
          this.currentMapBehaviorSubject$.next(mapName);
        })
      )
      .subscribe();

    // if (environment.production) {
    //   this.timer$ = this.reset$.pipe(
    //     startWith(0),
    //     switchMap(() => timer(0, 20000)) //  20000, Set a timer to check the mqtt connection, and reset the timer if the mqtt battery topic has posted some data.
    //   );
    // }
  }
}
