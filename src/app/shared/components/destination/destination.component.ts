import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { Category } from '../../utils/map-wrapper/interface/map-wrapper';
import { Metadata } from '../localization-form/localization-form.component';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss']
})
export class DestinationComponent implements OnInit, OnDestroy {
  type = Category.POSITIONLISTENER;
  floorPlanData: any = null;
  rosMapData: any = null;
  metaData: Metadata;
  currentRobotPose: any;
  targetWaypointData;
  sub = new Subscription();
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService,
    private router: Router
  ) {
    this.sub = this.sharedService.currentMap$
      .pipe(
        mergeMap(currentMap =>
          this.mapService.getMapImage(currentMap).pipe(
            tap(image => {
              const reader = new FileReader();
              reader.readAsDataURL(image);
              reader.onloadend = () => {
                this.rosMapData = { map: reader.result };
              };
            }),
            map(() => currentMap)
          )
        ),
        mergeMap(currentMap =>
          this.mapService
            .getMapMetaData(currentMap)
            .pipe(tap(metaData => (this.metaData = metaData)))
        )
      )
      .subscribe(
        () => {},
        error => {
          setTimeout(() => this.router.navigate(['/']), 5000);
        }
      );

    this.sub.add(
      this.mqttService.pose$
        .pipe(
          map(pose => JSON.parse(pose)),
          tap(pose => (this.currentRobotPose = pose))
        )
        .subscribe()
    );

    this.sub.add(
      this.mqttService.pauseResume$
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

    this.sub.add(
      this.sharedService.departureWaypoint$.subscribe(data => {
        if (data) {
          const { x, y, name } = data;
          this.targetWaypointData = {
            targetX: x,
            targetY: y,
            targetAngle: 0,
            targetName: name
          };
        } else {
          this.router.navigate(['/']);
        }
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
