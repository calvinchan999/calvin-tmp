import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { Metadata } from '../localization-form/localization-form.component';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss'],
})
export class DestinationComponent implements OnInit {
  @Input() payload: any;
  floorPlanImg: string;
  rosMapImage: string;
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
    this.sub = this.sharedService.currentMap$.subscribe((currentMap) => {
      console.log('currentMap: ', currentMap);
      if (currentMap) {
        this.mapService
          .getMapImage(currentMap)
          .pipe(
            mergeMap(async (data) => {
              const img: string = URL.createObjectURL(data);
              return (
              (this.floorPlanImg = ""),
              (this.rosMapImage = img)
            );
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
      this.mqttService.$pose
        .pipe(
          map((pose) => JSON.parse(pose)),
          tap((pose) => (this.currentRobotPose = pose))
        )
        .subscribe()
    );

    this.sub.add(
      this.mqttService.$pauseResume
        .pipe(
          map((pauseResume) => {
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
        .subscribe((data) => {
          const { tranlateMessageKey } = data;
          this.translateService.get(tranlateMessageKey).subscribe((message) => {
            this.sharedService.response$.next({ type: 'normal', message });
          });
        })
    );
  }

  ngOnInit(): void {}

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
    if (this.sub) { this.sub.unsubscribe(); }
  }
}
