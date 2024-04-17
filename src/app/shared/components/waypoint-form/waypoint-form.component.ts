import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { mergeMap, tap, take } from 'rxjs/operators';
// import {
//   WaypointService,
//   Waypoint,
//   TaskConfig
// } from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { SharedService } from 'src/app/services/shared.service';
// import { TaskService } from 'src/app/views/services/task.service';
// import { AppConfigService } from 'src/app/services/app-config.service';
import {
  MissionService,
  Mission
} from 'src/app/views/services/mission.service';
import { AppConfigService } from 'src/app/services/app-config.service';

export enum ProjectSite {
  AA = 'AA',
  HONGCHI = 'HONGCHI',
  HKSTP = 'HKSTP'
}

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss']
})
export class WaypointFormComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter(false);
  // waypointLists$: Observable<
  //   any
  // > = this.sharedService.currentMapBehaviorSubject$.pipe(
  //   take(1),
  //   mergeMap((currentMap: string) => {
  //     if (currentMap) {
  //       const filter = _.pickBy({ mapName: currentMap }, _.identity);
  //       return this.waypointService.getWaypoint({ filter }).pipe(
  //         map(data => {
  //           const dataTransfor = [];
  //           for (const i of data) {
  //             const splitName = i.name.split('%');
  //             dataTransfor.push({
  //               ...i,
  //               waypointName: splitName[1] ?? splitName[0]
  //             });
  //           }
  //           return _.orderBy(dataTransfor, 'waypointName', 'asc');
  //         })
  //       );
  //     } else {
  //       return of(null).pipe(tap(() => this.router.navigate(['/'])));
  //     }
  //   })
  // );

  project: string = this.appConfigService.getConfig().application.site;
  missions$: Observable<
    any
  > = this.sharedService.currentMapBehaviorSubject$.pipe(
    take(1),
    mergeMap((currentMap: string) => {
      if (
        currentMap !== '' &&
        !!currentMap &&
        this.project !== ProjectSite.HKSTP
      ) {
        const filter = _.pickBy(
          { floorPlanCode: currentMap, orderBy: 'name' },
          _.identity
        );
        return this.missionService.getMission({ filter });
      } else if (this.project === ProjectSite.HKSTP) {
        return this.missionService.getMission();
      } else {
        return of(null).pipe(tap(() => this.router.navigate(['/'])));
      }
    })
  );

  selectedMission: Mission;
  sub = new Subscription();

  constructor(
    // private waypointService: WaypointService,
    private sharedService: SharedService,
    private router: Router,
    // private taskService: TaskService,
    private appConfigService: AppConfigService,
    private missionService: MissionService
  ) {
    // this.sub = this.sharedService.isClosedModal$
    //   .pipe(
    //     switchMap(dialogType => {
    //       if (this.appConfigService.getConfig().enableJobsRefId) {
    //         const robotId = this.sharedService.currentRobotId.value;
    //         return this.taskService.getRobotStatusJobId(robotId).pipe(
    //           map(jobRefId => {
    //             return { jobRefId, dialogType };
    //           })
    //         );
    //       } else {
    //         return of({ jobRefId: null, dialogType });
    //       }
    //     })
    //   )
    //   .subscribe(data => {
    //     const { dialogType, jobRefId } = data;
    //     if (dialogType === 'confirmation-dialog') {
    //       let data: TaskConfig;
    //       if (this.appConfigService.getConfig().enableJobsRefId) {
    //         data = {
    //           jobId: jobRefId ? jobRefId : null,
    //           taskItemList: [
    //             {
    //               movement: {
    //                 waypointName: this.selectedWaypoint.name
    //               }
    //             }
    //           ]
    //         };
    //       } else {
    //         data = {
    //           taskItemList: [
    //             {
    //               movement: {
    //                 waypointName: this.selectedWaypoint.name
    //               }
    //             }
    //           ]
    //         };
    //       }
    //       this.waypointService.sendTask(data).subscribe(() => {
    //         this.router.navigate(['/waypoint/destination']);
    //       });
    //     }
    //   });

    this.sub = this.sharedService.isClosedModal$
      .pipe(
        mergeMap(dialogType => {
          if (dialogType === 'confirmation-dialog') {
            const missionId = this.selectedMission.missionId;
            return this.missionService.executeMission(missionId);
          } else {
            return of(null);
          }
        })
      )
      .subscribe(() => this.router.navigate(['/waypoint/destination']));
  }

  ngOnInit() {}

  // onSelectedWaypoint(waypoint: Waypoint) {
  //   this.selectedWaypoint = waypoint;
  // }

  onSelectedMission(mission) {
    this.selectedMission = mission;
  }

  // onSubmitModel(selectedWaypoint: Waypoint) {
  //   if (selectedWaypoint) {
  //     this.sharedService.isOpenModal$.next({
  //       modal: 'confirmation-dialog',
  //       modalHeader: '',
  //       isDisableClose: true,
  //       metaData: {
  //         message: 'destinationReminding',
  //         submitButtonName: 'start',
  //         height: '150px',
  //         width: '150px',
  //         fontSize: '42px',
  //         component: 'waypoint'
  //       }
  //     });
  //   }
  // }

  onSubmitModel(selectedMission) {
    if (selectedMission) {
      const metaData =
        this.appConfigService.getConfig().application.site === 'HKSTP'
          ? {
              message: '',
              submitButtonName: 'start',
              height: '150px',
              width: '150px',
              fontSize: '42px',
              component: 'waypoint'
            }
          : {
              message: 'destinationReminding',
              submitButtonName: 'start',
              height: '150px',
              width: '150px',
              fontSize: '42px',
              component: 'waypoint'
            };

      this.sharedService.isOpenModal$.next({
        modal: 'confirmation-dialog',
        modalHeader: '',
        isDisableClose: true,
        metaData
      });
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
