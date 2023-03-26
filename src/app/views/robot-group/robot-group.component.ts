import { Component, OnInit } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from '../services/map.service';
import { RobotGroupService } from '../services/robot-group.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-robot-group',
  templateUrl: './robot-group.component.html',
  styleUrls: ['./robot-group.component.scss']
})
export class RobotGroupComponent implements OnInit {
  robots;
  robotId: string;
  selectedRobots: any; // todo

  sub = new Subscription();
  constructor(
    private sharedService: SharedService,
    private mapService: MapService,
    private robotGroupService: RobotGroupService
  ) {
    this.sub = this.sharedService.currentRobotId
      .pipe(tap(id => (this.robotId = id)))
      .subscribe();
  }

  ngOnInit() {
    this.sharedService.currentMap$
      .pipe(
        take(1),
        mergeMap(map => {
          const param = { param: { mapCode: map, offset: 0, rowCount: 100 } };
          return this.robotGroupService.getFmsFloorPlanCode(param);
        }),
        switchMap(map => {
          const floorPlans = _.uniqBy(map, 'floorPlanCode');
          let obs = [];
          floorPlans.forEach((floorPlan: any) => {
            const { floorPlanCode } = floorPlan;
            const param = { param: { floorPlanCode } };
            obs.push(this.robotGroupService.getRobots(param));
          });
          return forkJoin(obs);
        }),
        map(vals => {
          const result = [];
          vals.map((row: any) => {
            row.forEach(col => {
              result.push(col);
            });
          });
          return result;
        })
      )
      .subscribe(res => {
        this.robots = res;
      });
  }

  onEventRobot(event: Event) {
    this.selectedRobots = event;
  }

  onSubmit(data) {
    if (data && data.length >= 2) {
      // if (this.robotId) {
      this.sharedService.isOpenModal$.next({
        modal: 'join-robot-group',
        modalHeader: 'joinRobotGroup',
        isDisableClose: true,
        closeAfterRefresh: false,
        metaData: data,
        robotId: this.robotId
      });
      // }
    } else {
      this.sharedService.response$.next({
        type: 'normal',
        message: 'twoOrMoreRobots'
      });
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
