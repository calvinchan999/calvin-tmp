import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subscription, iif, of } from 'rxjs';
import { map, tap, take, finalize, switchMap, delay, mergeMap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Auth, AuthService } from 'src/app/services/auth.service';
// import { IndexedDbService } from 'src/app/services/indexed-db.service';
import { SharedService } from 'src/app/services/shared.service';
import { ModeService } from '../services/mode.service';
import { TaskService } from '../services/task.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { ErrorLogService } from 'src/app/services/error-log.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  map: string;
  mode: string;
  role: string;
  user: string;
  features;
  pairingState;
  followMePairingState$: Observable<boolean>;
  followMeUnPairingState$: Observable<boolean>;

  robotReleaseStatus: boolean = false;
  robotReserveStatus: boolean = false;

  sub = new Subscription();

  constructor(
    public router: Router,
    private sharedService: SharedService,
    private authService: AuthService,
    // private indexedDbService: IndexedDbService,
    private appConfigService: AppConfigService,
    // private modeService: ModeService,
    private taskService: TaskService,
    private dbService: NgxIndexedDBService,
    private errorLogService: ErrorLogService
  ) {
    this.features = this.appConfigService.getConfig().feature;
    this.sharedService.currentMode$.pipe(take(1)).subscribe((mode: string) => {
      this.mode = mode;
      console.log(`mode: ${mode}`);
    });

    this.sharedService.currentMap$
      .pipe(take(1))
      .subscribe((currentMap: string) => {
        this.map = currentMap;
      });

    this.sharedService.currentPairingStatus$
      // .pipe(map(data => (data instanceof Object ? data : JSON.parse(data))))
      .subscribe(data => {
        if (data?.pairingState) {
          const { pairingState } = data;
          if (pairingState === 'UNPAIRED') {
            this.followMePairingState$ = new Observable(observer =>
              observer.next(true)
            );
            this.followMeUnPairingState$ = new Observable(observer =>
              observer.next(false)
            );
          } else if (pairingState !== 'UNPAIRED') {
            this.followMePairingState$ = new Observable(observer =>
              observer.next(false)
            );
            this.followMeUnPairingState$ = new Observable(observer =>
              observer.next(true)
            );
          }
        } else {
          this.followMePairingState$ = new Observable(observer =>
            observer.next(false)
          );
          this.followMeUnPairingState$ = new Observable(observer =>
            observer.next(false)
          );
        }
      });

    // this.sharedService.isProcessingTask$.subscribe((task: boolean) => {
    //   this.isProcessingTask = task;
    // })
  }

  ngOnInit() {
    this.isAuthenticated();
    this.isRobotHeld();
  }

  ngAfterViewInit() {}

  isAuthenticated() {
    this.authService.isAuthenticatedSubject
      .pipe(
        map(payload => {
          return JSON.parse(payload);
        }),
        tap((payload: Auth) => {
          if (payload?.userId) {
            this.user = payload.userId;
          } else {
            this.user = null;
          }
        })
      )
      .subscribe();
  }

  onSubmitWaypont() {
    if (this.mode === 'NAVIGATION') {
      this.router.navigate(['/waypoint']);
    }
  }

  onDockToStation() {
    this.router.navigate(['/charging']);
  }

  onSubmitSOS() {
    this.sharedService.isOpenModal$.next({
      modal: 'sos',
      modalHeader: 'sos',
      isDisableClose: false
    });
  }

  onChangeMap() {
    if (this.mode && this.mode !== 'UNDEFINED') {
      this.router.navigate(['/map']);
    }
  }

  onSubmitLocalization() {
    if (this.mode === 'NAVIGATION') {
      this.router.navigate(['/localization']);
    }
  }

  onChangeMode() {
    this.router.navigate(['/mode']);
  }

  onDownloadLogs() {
    const robotId: any = this.sharedService.robotIdBahaviorSubject.value;
    this.errorLogService.downloadRecords(robotId);
  // this.indexedDbService
  //   .getLogs()
  //   .pipe(
  //     mergeMap((logs: any) => this.indexedDbService.generateLogsPdf(logs))
  //   )
  //   .subscribe();
  }

  onClickPairing() {
    this.sharedService.isOpenModal$.next({
      modal: 'pair',
      modalHeader: 'pair',
      isDisableClose: true,
      closeAfterRefresh: false
    });
  }

  onClickUnPairing() {
    this.sharedService.isOpenModal$.next({
      modal: 'unpair',
      modalHeader: 'unpair',
      isDisableClose: true,
      closeAfterRefresh: false
    });
  }

  onClickFollowRobotGroup() {
    this.router.navigate(['/robot-group']);
  }

  onClickTaskReserve() {
    this.taskService
      .holdTask()
      .pipe(tap(() => this.router.navigate(['/'])))
      .subscribe();
  }

  onClickTaskRelease() {
    this.taskService
      .releaseTask()
      .pipe(tap(() => this.router.navigate(['/'])))
      .subscribe();
  }

  isRobotHeld() {
    this.sub = this.sharedService.isRobotHeldBehaviorSubject
      .pipe(
        tap(status => {
          if (status) {
            this.robotReleaseStatus = true;
            this.robotReserveStatus = false;
          } else if (status == false) {
            this.robotReleaseStatus = false;
            this.robotReserveStatus = true;
          }
        })
      )
      .subscribe();
  }

  onClickClearCache() {
    of(EMPTY)
      .pipe(
        switchMap(() => this.dbService.clear('map')),
        tap(() =>
          this.sharedService.response$.next({
            type: 'normal',
            message: 'cacheClearSuccessful'
          })
        ),
        delay(2000),
      )
      .subscribe(() => this.router.navigate(['/dashboard']));
  }

  onClickCamera() {
    this.router.navigate(['/camera']);
  }

  // debugMap(){
  //   this.router.navigate(['/waypoint/destination']);
  // }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
