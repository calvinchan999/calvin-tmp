import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Auth, AuthService } from 'src/app/services/auth.service';
import { IndexedDbService } from 'src/app/services/indexed-db.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  mode: string;
  role: string;
  user: string;
  features;
  pairingState;
  constructor(
    public router: Router,
    private sharedService: SharedService,
    private authService: AuthService,
    private indexedDbService: IndexedDbService,
    private appConfigService: AppConfigService
  ) {
    this.features = this.appConfigService.getConfig().feature;
    this.sharedService.currentMode$.pipe().subscribe((mode: string) => {
      this.mode = mode;
      console.log(`mode: ${mode}`);
    });

    this.sharedService.currentPairingStatus$
      .pipe(map((data) => (data instanceof Object ? data : JSON.parse(data))))
      .subscribe((data) => {
        console.log(data);
        if (data?.pairingState) {
          const { pairingState } = data;
          this.pairingState = pairingState;
        } else {
          this.pairingState = null;
        }
      });
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
    if (this.mode && this.mode !=='UNDEFINED' ) {
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
    this.indexedDbService
      .getLogs()
      .pipe(
        mergeMap((logs: any) => this.indexedDbService.generateLogsPdf(logs))
      )
      .subscribe();
  }

  onClickPairing() {
    this.sharedService.isOpenModal$.next({
      modal: 'pair',
      modalHeader: 'pair',
      isDisableClose: true,
    });
  }

  onClickUnPairing() {
    this.sharedService.isOpenModal$.next({
      modal: 'unpair',
      modalHeader: 'unpair',
      isDisableClose: true,
    });
  }
}
