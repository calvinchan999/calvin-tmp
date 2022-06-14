import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { Category } from '../../utils/map-wrapper/interface/map-wrapper';
import { Metadata } from '../localization-form/localization-form.component';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss'],
})
export class DestinationComponent implements OnInit {
  @Input() payload: any;
  type = Category.POSITIONLISTNER;
  floorPlanData: any = null;
  rosMapData: any = null;
  metaData: Metadata;
  currentRobotPose: any;

  sub = new Subscription();
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService
  ) {
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
              // const img: string = URL.createObjectURL(data);
              let floorPlan = {
                code: data.code,
                id: data.id,
                imageData: data?.imageData,
                name: data.name,
                floorPlanPointList: data?.floorPlanPointList,
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

    this.sub.add(
      this.mqttService.$pose
        .pipe(
          map(pose => JSON.parse(pose)),
          tap(pose => (this.currentRobotPose = pose))
        )
        .subscribe()
    );

    this.sub.add(
      this.mqttService.$pauseResume
        .pipe(
          map(pauseResume => {
            let data = JSON.parse(pauseResume);
            const { pauseResumeState } = data;
            if (pauseResumeState === 'RESUME') {
              data = { ...data, ...{ tranlateMessageKey: 'resumeMessage' } };
            } else if (pauseResumeState === 'PAUSE') {
              data = { ...data, ...{ tranlateMessageKey: 'pauseMessage' } };
            }
            return data;
          })
        )
        .subscribe(data => {
          const { tranlateMessageKey } = data;
          this.translateService.get(tranlateMessageKey).subscribe(message => {
            this.sharedService.response$.next({ type: 'normal', message });
          });
        })
    );
  }

  ngOnInit() {}

  onPause() {
    setTimeout(() => {
      this.waypointService.pause().subscribe();
    }, 1000);
  }

  onResume() {
    setTimeout(() => {
      this.waypointService.resume().subscribe();
    }, 1000);
  }

  onCancel() {
    setTimeout(() => {
      this.waypointService.deleteTask().subscribe();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
