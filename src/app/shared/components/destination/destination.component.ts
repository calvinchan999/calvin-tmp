import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { EditorType } from '../../utils/map-wrapper/map-wrapper.component';
import { Metadata } from '../localization-form/localization-form.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss']
})
export class DestinationComponent implements OnInit, OnDestroy {
  // @Input() payload: any;
  rosMapImage: string;
  metaData: Metadata;
  robotPose: any;

  sub = new Subscription();
  waypoint;
  editor = EditorType['POSITIONLISTENER'];
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
          // this.mapService.getMapImage(currentMap).pipe(
          //   tap(mapImage => {
          //     const img: string = URL.createObjectURL(mapImage);
          //     return (this.rosMapImage = img);
          //   }),
          //   map(() => currentMap)
          // )
          {
            const param = _.pickBy({ imageIncluded: 'true' }, _.identity);
            const queries = { param };
            return this.mapService.getMap(currentMap, queries).pipe(
              tap(mapInfo => {
                const { base64Image } = mapInfo;
                this.rosMapImage = base64Image;
              }),
              map(() => currentMap)
            );
          }
        ),
        mergeMap(currentMap =>
          this.mapService
            .getMapMetadata(currentMap)
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
      this.mqttService.poseSubject
        .pipe(
          map(pose => JSON.parse(pose)),
          tap(pose => (this.robotPose = pose))
        )
        .subscribe()
    );

    this.sub.add(
      this.mqttService.pauseResumeSubject
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
          this.waypoint = {
            targetX: x,
            targetY: y,
            targetAngle: 0,
            targetName: name
          };
        }
      })
    );
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (!this.waypoint) {
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
