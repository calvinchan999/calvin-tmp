import { Component, OnInit } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
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
  constructor(
    private sharedService: SharedService,
    private mapService: MapService,
    private robotGroupService: RobotGroupService
  ) {
    this.sharedService.currentRobotId
      .pipe(tap(id => (this.robotId = id)))
      .subscribe();
  }

  ngOnInit() {
    this.sharedService.currentMap$
      .pipe(
        mergeMap(map => this.mapService.getMap(map)),
        tap((map: any) => console.log(map)),
        tap(map => {
          let { floorPlanCode } = map;
          floorPlanCode = floorPlanCode ? floorPlanCode : ''; // todo
          const robotType = ''; // todo
          const param = { param: { floorPlanCode, robotType } };
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
}
