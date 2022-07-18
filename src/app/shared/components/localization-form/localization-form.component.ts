import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import {
  LocalizationType,
  SharedService,
} from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapService } from 'src/app/views/services/map.service';
import {
  Waypoint,
  WaypointService,
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { Router } from '@angular/router';

export interface Metadata {
  x: number;
  y: number;
  resolution: number;
}
@Component({
  selector: 'app-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
})
export class LocalizationFormComponent implements OnInit {
  sub = new Subscription();
  floorPlanImg: string;
  rosMapImage: string;
  metaData: Metadata;
  message: any;
  type: string;

  waypointLists$: Observable<any> =
    this.sharedService.currentMapBehaviorSubject$.pipe(
      mergeMap((map) => this.waypointService.getWaypoint(map)),
      map((data) => {
        const dataTransfor = [];
        for (let i of data) {
          const splitName = i.name.split('%');
          dataTransfor.push({
            ...i,
            waypointName: splitName[1] ?? splitName[0],
          });
        }
        return _.orderBy(dataTransfor, 'waypointName', 'asc');
      })
    );
  selectedWaypoint: Waypoint;

  constructor(
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService,
    private waypointService: WaypointService,
    private router: Router
  ) {}

  ngOnInit() {
    this.setMessage();
    this.sub = this.sharedService.currentMap$.subscribe((currentMap) => {
      if (currentMap) {
        this.mapService
          .getMapImage(currentMap)
          .pipe(
            mergeMap(async (data) => {
              const img: string = URL.createObjectURL(data);
              return (this.floorPlanImg = ''), (this.rosMapImage = img);
            }),
            mergeMap(() =>
              this.mapService
                .getMapMetaData(currentMap)
                .pipe(tap((metaData) => (this.metaData = metaData)))
            )
          )
          .subscribe();
      }
    });

    this.sub.add(
      this.sharedService.localizationType$
        .pipe(tap((type) => (this.type = LocalizationType[type])))
        .subscribe()
    );
  }

  setMessage() {
    this.translateService
      .get('localizationDialog.successMessage')
      .pipe(
        map((msg) => {
          return {
            type: 'normal',
            message: msg,
          };
        })
      )
      .subscribe((res: any) => {
        const success = res;
        this.message = { ...this.message, success };
      });

    this.translateService
      .get('localizationDialog.failedMessage')
      .pipe(
        map((msg) => {
          return {
            type: 'normal',
            message: msg,
          };
        })
      )
      .subscribe((res: any) => {
        const fail = res;
        this.message = { ...this.message, fail };
      });
  }

  isLocalizedLocation(event: any) {
    const { status, error } = event;
    if (status === 'success') {
      this.sharedService.response$.next({
        type: this.message.success.type,
        message: this.message.success.message,
      });
    } else if (status === 'failed') {
      this.sharedService.response$.next({
        type: this.message.fail.type,
        message: `${this.message.fail.message} \n ${error.message}`,
      });
    }
  }

  onSelectedWaypoint(waypoint: Waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onSubmitLocalizationPoint(point) {
    this.waypointService.localize(point).subscribe(
      () => {
        this.isLocalizedLocation({
          status: 'success',
        });

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      (error) => {
        this.isLocalizedLocation({
          status: 'failed',
          error,
        });
      }
    );
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
