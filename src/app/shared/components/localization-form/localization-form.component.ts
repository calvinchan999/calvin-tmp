import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, iif, Observable, of, Subscription } from 'rxjs';
import {
  catchError,
  delay,
  map,
  mergeMap,
  switchMap,
  tap
} from 'rxjs/operators';
import {
  LocalizationType,
  SharedService
} from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapService } from 'src/app/views/services/map.service';
import {
  Waypoint,
  WaypointService
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { EditorType } from '../../utils/map-wrapper/map-wrapper.component';
import { ToastrService } from 'ngx-toastr';
// import { IndexedDbService } from 'src/app/services/indexed-db.service';

export interface Metadata {
  x: number;
  y: number;
  resolution: number;
}
@Component({
  selector: 'app-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss']
})
export class LocalizationFormComponent implements OnInit, OnDestroy {
  sub = new Subscription();
  floorPlanImg: string;
  rosMapImage: string;
  metaData: Metadata;
  message: any;
  type: string;
  editor = EditorType.LOCALIZATIONEDITOR;
  waypointLists$: Observable<
    any
  > = this.sharedService.currentMapBehaviorSubject$.pipe(
    mergeMap(mapResult => {
      if (mapResult && mapResult?.length > 0) {
        const filter = _.pickBy({ mapName: mapResult }, _.identity);
        return this.waypointService.getWaypoint({ filter });
      } else {
        return of(null).pipe(tap(() => this.router.navigate(['/'])));
      }
    }),
    map(data => {
      const dataTransfor = [];
      if (data?.length > 0) {
        for (const i of data) {
          const splitName = i.name.split('%');
          dataTransfor.push({
            ...i,
            waypointName: splitName[1] ?? splitName[0]
          });
        }
      }
      return _.orderBy(dataTransfor, 'waypointName', 'asc');
    })
  );
  selectedWaypoint: Waypoint;
  localizationCorrectBgmPath: string = `./assets/musics/correct.mp3`;
  mapName: string;
  newRatio: number = 1;

  constructor(
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService,
    private waypointService: WaypointService,
    private router: Router,
    private toastrService: ToastrService // private indexedDbService: IndexedDbService
  ) {
    this.setMessage();
  }

  ngOnInit() {
    this.sub = this.sharedService.currentMap$
      .pipe(
        mergeMap((currentMap: any) => {
          // if (currentMap) {

          // this.mapService
          //   .getMapImage(currentMap)
          //   .pipe(
          //     mergeMap(async data => {
          //       // const img: string = URL.createObjectURL(data);
          //       // return (this.floorPlanImg = ''), (this.rosMapImage = img);

          //     }),
          const param = _.pickBy({ imageIncluded: 'true' }, _.identity);
          const queries = { param };

          this.mapName = currentMap;

          const ob1$ = this.mapService.getMap(currentMap, queries).pipe(
            tap(mapInfo => {
              const { base64Image } = mapInfo;
              this.rosMapImage = base64Image;
              // this.floorPlanImg = '';
            }),
            mergeMap(() =>
              this.mapService
                .getMapMetadata(currentMap)
                .pipe(tap(metaData => (this.metaData = metaData)))
            )
          );

          const ob2$ = this.mapService.getMapMetadata(currentMap).pipe(
            tap(metaData => {
              this.metaData = metaData;
              const { image, newRatio } = JSON.parse(
                localStorage.getItem(`map_${currentMap}`)
              );
              this.rosMapImage = image;
              this.newRatio = newRatio;
            })
          );
          const isExist = localStorage.getItem(`map_${currentMap}`)
            ? true
            : false;

          return of(EMPTY).pipe(mergeMap(() => iif(() => isExist, ob2$, ob1$)));

          // this.mapService
          //   .getMap(currentMap, queries)
          //   .pipe(
          //     tap(mapInfo => {
          //       const { base64Image } = mapInfo;
          //       this.rosMapImage = base64Image;
          //       // this.floorPlanImg = '';
          //     }),
          //     mergeMap(() =>
          //       this.mapService
          //         .getMapMetadata(currentMap)
          //         .pipe(tap(metaData => (this.metaData = metaData)))
          //     )
          //   )
          //   .subscribe();
          // }
        })
      )
      .subscribe();

    this.sub.add(
      this.sharedService.localizationType$
        .pipe(tap(type => (this.type = LocalizationType[type])))
        .subscribe()
    );
  }

  setMessage() {
    this.translateService
      .get('localizationDialog.successMessage')
      .pipe(
        map(msg => {
          return {
            type: 'normal',
            message: msg
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
        map(msg => {
          return {
            type: 'normal',
            message: msg
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
        type: this.message?.success.type,
        message: this.message?.success.message
      });
    } else if (status === 'failed') {
      this.sharedService.response$.next({
        type: this.message?.fail.type,
        message: `${this.message?.fail.message} \n ${error.message}`
      });
    }
  }

  onSelectedWaypoint(waypoint: Waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onSubmitLocalizationPoint(point) {
    const { x, y, angle, name } = point;
    // this.waypointService.localize(name).subscribe(
    //   result => {
    //     const { success, message } = result;
    //     if (success) {
    //       this.isLocalizedLocation({
    //         status: 'success'
    //       });

    //       const audio = new Audio();
    //       audio.src = this.localizationCorrectBgmPath;
    //       audio.play();

    //       setTimeout(() => {
    //         this.router.navigate(['/']);
    //       }, 5000);
    //     } else {
    //       this.isLocalizedLocation({
    //         status: 'failed',
    //         error: {
    //           message
    //         }
    //       });
    //     }
    //   },
    //   error => {
    //     this.isLocalizedLocation({
    //       status: 'failed',
    //       error
    //     });
    //   }
    // );

    this.waypointService
      .initialPose({ x, y, angle })
      .pipe(
        delay(0),
        tap(() => this.sharedService.loading$.next(true)),
        delay(15000), //Use a 15s delay after calling the Pose Deviation API, as the robot does not update its status immediately
        mergeMap(() => this.waypointService.poseDeviation()),
        tap(deviationRes => {
          const {
            poseValid,
            translationDeviation,
            angleDeviation
          } = deviationRes;

          let msg;

          // const msg = this.translateService.instant(
          //   'toast.inconnectLocalization',
          //   {
          //     poseValid,
          //     translationDeviation,
          //     angleDeviation
          //   }
          // );

          if (poseValid) {
            msg = this.translateService.instant(
              'localizationDialog.poseDeviationSuccessMessage'
            );
          } else {
            msg = this.translateService.instant(
              'localizationDialog.poseDeviationFailedMessage'
            );
          }

          this.toastrService.warning(msg);
        })
      )
      .subscribe(
        () => {
          this.isLocalizedLocation({
            status: 'success'
          });

          const audio = new Audio();
          audio.src = this.localizationCorrectBgmPath;
          audio.play();

          setTimeout(() => {
            // this.router.navigate(['/']);

            this.sharedService.isOpenModal$.next({
              modal: 'confirmation-dialog',
              modalHeader: '',
              isDisableClose: false,
              metaData: {
                viewComponentRef: '',
                message: 'localizationDialog.confirmation',
                submitButtonName: 'confirm',
                height: '50px',
                width: '150px',
                fontSize: '22px',
                component: 'localization',
                editor: this.editor,
                floorPlanImg: this.floorPlanImg,
                rosMapImage: this.rosMapImage,
                metaData: this.metaData,
                mapName: this.mapName,
                newRatio: this.newRatio
              }
            });
          }, 3000);
        },
        error => {
          this.isLocalizedLocation({
            status: 'failed',
            error
          });
        }
      );
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
