import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapService } from 'src/app/views/services/map.service';
import { Category } from '../../utils/map-wrapper/interface/map-wrapper';

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
  type = Category.LOCALIZATIONEDITER;
  floorPlanData;
  rosMapData;
  metaData: Metadata;
  message: any;

  sub = new Subscription();

  constructor(
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.setMessage();
    this.sub = this.sharedService.currentMap$.subscribe(currentMap => {
      if (currentMap) {
        const data = {
          code: currentMap,
          floorPlanIncluded: false,
          mapIncluded: true
        };
        this.mapService
          .getFloorPlanData(data)
          .pipe(
            mergeMap(async data => {
              let floorPlan = {
                code: data.code,
                id: data.id,
                imageData: data?.imageData,
                name: data.name,
                loorPlanPointList: data?.floorPlanPointList,
                rosMapPointList: data?.rosMapPointList
              };
              let rosMap = {
                map: data?.map
              };

              return (
                (this.floorPlanData = floorPlan), (this.rosMapData = rosMap)
              );
            }),
            mergeMap(() =>
              this.mapService
                .getMapMetaData(currentMap)
                .pipe(tap(metaData => (this.metaData = metaData)))
            )
          )
          .subscribe();
      }
    });
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
        type: this.message.success.type,
        message: this.message.success.message
      });
    } else if (status === 'failed') {
      this.sharedService.response$.next({
        type: this.message.fail.type,
        message: `${this.message.fail.message} \n ${error.message}`
      });
    }
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
