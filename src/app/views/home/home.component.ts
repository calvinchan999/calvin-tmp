import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, mergeMap, tap, take } from 'rxjs/operators';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Auth, AuthService } from 'src/app/services/auth.service';
import { IndexedDbService } from 'src/app/services/indexed-db.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
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
  constructor(
    public router: Router,
    private sharedService: SharedService,
    private authService: AuthService,
    private indexedDbService: IndexedDbService,
    private appConfigService: AppConfigService
  ) {
    this.features = this.appConfigService.getConfig().feature;
    this.sharedService.currentMode$.pipe(take(1)).subscribe((mode: string) => {
      this.mode = mode;
      console.log(`mode: ${mode}`);
    });

    this.sharedService.currentMap$.pipe(take(1)).subscribe((currentMap: string) => {
      this.map = currentMap;
    });

    this.sharedService.currentPairingStatus$
      .pipe(map((data) => (data instanceof Object ? data : JSON.parse(data))))
      .subscribe((data) => {
        if (data?.pairingState) {
          const { pairingState } = data;
          if (pairingState === 'UNPAIRED') {
            this.followMePairingState$ = new Observable((observer) =>
              observer.next(true)
            );
            this.followMeUnPairingState$ = new Observable((observer) =>
              observer.next(false)
            );
          } else if (pairingState !== 'UNPAIRED') {
            this.followMePairingState$ = new Observable((observer) =>
              observer.next(false)
            );
            this.followMeUnPairingState$ = new Observable((observer) =>
              observer.next(true)
            );
          }
        } else {
          this.followMePairingState$ = new Observable((observer) =>
            observer.next(false)
          );
          this.followMeUnPairingState$ = new Observable((observer) =>
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
  }

  isAuthenticated() {
    this.authService.isAuthenticatedSubject
      .pipe(
        map((payload) => {
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
      isDisableClose: false,
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
      closeAfterRefresh: false,
    });
  }

  onClickUnPairing() {
    this.sharedService.isOpenModal$.next({
      modal: 'unpair',
      modalHeader: 'unpair',
      isDisableClose: true,
      closeAfterRefresh: false,
    });
  }
}
