import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap, finalize, delay } from 'rxjs/operators';
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
  // @Input() payload: any;
  rosMapImage: string;
  metaData: Metadata;
  currentRobotPose: any;

  sub = new Subscription();
  targetWaypointData;
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService,
    private router: Router
  ) {
    this.sub = this.sharedService.currentMap$.subscribe((currentMap) => {
      console.log('currentMap: ', currentMap);
      if (currentMap) {
        this.mapService
          .getMapImage(currentMap)
          .pipe(
            mergeMap(async (data) => {
              const img: string = URL.createObjectURL(data);
              return (this.rosMapImage = img);
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
      this.mqttService.pose$
        .pipe(
          map((pose) => JSON.parse(pose)),
          tap((pose) => (this.currentRobotPose = pose))
        )
        .subscribe()
    );

    this.sub.add(
      this.mqttService.pauseResume$
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

    this.sub.add(
      this.sharedService.departureWaypoint$.subscribe((data) => {
        if (data) {
          const { x, y, name } = data;
          this.targetWaypointData = {
            targetX: x,
            targetY: y,
            targetAngle: 0,
            targetName: name,
          };
        }
      })
    );
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (!this.targetWaypointData) {
        this.router.navigate(['/']);
      }
    }, 3000);
  }

  onPause() {
    this.waypointService
      .pause()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() => {
        setTimeout(() => this.sharedService.loading$.next(false), 3000);
      });
  }

  onResume() {
    this.waypointService
      .resume()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() =>
        setTimeout(() => this.sharedService.loading$.next(false), 3000)
      );
  }

  onCancel() {
    this.waypointService
      .deleteTask()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() =>
        setTimeout(() => this.sharedService.loading$.next(false), 3000)
      );
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
