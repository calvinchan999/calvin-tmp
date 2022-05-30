import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Auth, AuthService } from 'src/app/services/auth.service';
import { IndexedDbService } from 'src/app/services/indexed-db.service';
import { SharedService } from 'src/app/services/shared.service';
// import { ModalComponent } from 'src/app/shared/components/modal/modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  mode: string;
  role: string;
  user: string;
  features: any;
  constructor(
    public router: Router,
    private sharedService: SharedService,
    private authService: AuthService,
    private indexedDbService: IndexedDbService,
    private appConfigService: AppConfigService
  ) {
    this.features = this.appConfigService.getConfig().feature;

    // this.sharedService.isDynamicAction$.subscribe((reponse: any) => {
    this.sharedService.currentMode$.subscribe((mode: string) => {
      this.mode = mode;
      console.log(`mode: ${mode}`);
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
    this.router.navigate(['/map']);
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
}
