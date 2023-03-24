import { Component, OnInit } from '@angular/core';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { mergeMap, take, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from '../services/map.service';
import { RobotGroupService } from '../services/robot-group.service';

@Component({
  selector: 'app-robot-group',
  templateUrl: './robot-group.component.html',
  styleUrls: ['./robot-group.component.scss']
})
export class RobotGroupComponent implements OnInit {
  robotLists$: Observable<any> = EMPTY;
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
        take(2),
        mergeMap(map => {
          const param = { param: { mapCode:map, offset:0, rowCount: 100  } };
          return this.robotGroupService.getFmsFloorPlanCode(param)
        }),
        tap((map: any) => console.log(map)),
        tap(map => {
          let { floorPlanCode } = map;
          floorPlanCode = floorPlanCode ? floorPlanCode : ''; // todo
          // const robotType = ''; // todo
          const param = { param: {  } };
          this.robotLists$ = this.robotGroupService.getRobots(param);
        })
      )
      .subscribe();
  }

  onEventRobotLists(event: Event) {
    this.selectedRobots = event;
  }

  onSubmit(data) {
    if (data && data.length >= 2) {
      if (this.robotId) {
        this.sharedService.isOpenModal$.next({
          modal: 'join-robot-group',
          modalHeader: 'joinRobotGroup',
          isDisableClose: true,
          closeAfterRefresh: false,
          metaData: data,
          robotId: this.robotId
        });
      }
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
