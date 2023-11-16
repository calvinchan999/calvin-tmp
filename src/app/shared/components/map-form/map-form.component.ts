import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, iif, of } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapRequest, MapService } from 'src/app/views/services/map.service';
import * as _ from 'lodash';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import {
  filter,
  mergeMap,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { EditorType } from '../../utils/map-wrapper/map-wrapper.component';
import { NgxIndexedDBService } from 'ngx-indexed-db';

@Component({
  selector: 'app-map-form',
  templateUrl: './map-form.component.html',
  styleUrls: ['./map-form.component.scss']
})
export class MapFormComponent implements OnInit, OnDestroy {
  mapLists$: Observable<any> = this.mapService.getMap();
  waypointLists$;
  selectedMap: string;
  selectedWaypoint: string;
  clickEvent$ = new Subject();
  next: boolean = false;

  currentMetaData;
  rosMapImage;
  newRatio: number = 1;

  editor = EditorType.LOCALIZATIONEDITOR;
  currentMapObs = this.sharedService.currentMap$
    .asObservable()
    .pipe(shareReplay(1));

  mapSub = new Subscription();

  constructor(
    private modalComponent: ModalComponent,
    private mapService: MapService,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private dbService: NgxIndexedDBService
  ) {}

  ngOnInit(): void {
    this.clickEvent$
      .pipe(
        switchMap(() =>
          iif(
            () => !!this.selectedMap,
            of(EMPTY).pipe(
              switchMap(() => {
                if (this.selectedMap) {
                  const param = _.pickBy(
                    { mapName: this.selectedMap, initialLocalization: 'true' },
                    _.identity
                  );
                  const queries = { param };
                  return this.waypointService.getWaypoint(queries).pipe(
                    tap(waypointLists => {
                      this.next = true;
                      this.waypointLists$ = of(waypointLists);
                    }),
                    switchMap(() => of(EMPTY))
                  );
                } else {
                  return of(EMPTY);
                }
              })
            ),
            of(EMPTY)
          )
        )
      )
      .subscribe();
  }

  onSelectedMap(map) {
    this.selectedMap = map;

    this.dbService
      .getByKey('map', `ros_${map}`)
      .pipe(
        mergeMap((data: any) => {
          if (data) {
            return this.mapService.getMapMetadata(map).pipe(
              tap(metaData => {
                this.currentMetaData = metaData;
                const { image, newRatio } = JSON.parse(data.payload);
                this.rosMapImage = image;
                this.newRatio = newRatio;
              })
            );
          } else {
            const param = _.pickBy({ imageIncluded: 'true' }, _.identity);
            const queries = { param };
            return this.mapService.getMap(map, queries).pipe(
              tap(mapInfo => {
                const { base64Image } = mapInfo;
                this.rosMapImage = base64Image;
              }),
              mergeMap(() =>
                this.mapService
                  .getMapMetadata(map)
                  .pipe(tap(metaData => (this.currentMetaData = metaData)))
              )
            );
          }
        })
      )
      .subscribe();
  }

  onSelectedWaypoint(waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(mapName, waypointName) {
    if (mapName && waypointName) {
      const data: MapRequest = {
        mapName,
        waypointName,
        useInitialPose: true
      };

      this.mapService.changeMap(data).subscribe(() => {
        // this.modalComponent.closeTrigger$.next();
        // this.sharedService.response$.next({
        //   type: 'normal',
        //   message: 'mapDialog.tips1'
        // });

        if (this.currentMetaData && this.selectedMap && this.rosMapImage) {
          setTimeout(() => {
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
                component: 'map',
                editor: this.editor,
                rosMapImage: this.rosMapImage,
                metaData: this.currentMetaData,
                mapName: this.selectedMap,
                newRatio: this.newRatio
              }
            });
          }, 1000);
        }
      });
    }
  }

  onSubmitMap() {
    this.clickEvent$.next();
    this.sharedService.currentPageTitleEvent.next('localization')
  }

  ngOnDestroy() {
    if (this.mapSub) this.mapSub.unsubscribe();
  }
}
