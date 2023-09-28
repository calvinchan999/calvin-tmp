import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { map, mergeMap, tap, take, switchMap } from 'rxjs/operators';
import {
  WaypointService,
  Waypoint,
  TaskConfig
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { SharedService } from 'src/app/services/shared.service';
import { TaskService } from 'src/app/views/services/task.service';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss']
})
export class WaypointFormComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter(false);
  waypointLists$: Observable<
    any
  > = this.sharedService.currentMapBehaviorSubject$.pipe(
    take(1),
    mergeMap((currentMap: string) => {
      if (currentMap) {
        const filter = _.pickBy({ mapName: currentMap }, _.identity);
        return this.waypointService.getWaypoint({ filter }).pipe(
          map(data => {
            const dataTransfor = [];
            for (const i of data) {
              const splitName = i.name.split('%');
              dataTransfor.push({
                ...i,
                waypointName: splitName[1] ?? splitName[0]
              });
            }
            return _.orderBy(dataTransfor, 'waypointName', 'asc');
          })
        );
      } else {
        return of(null).pipe(tap(() => this.router.navigate(['/'])));
      }
    })
  );

  selectedWaypoint: Waypoint;
  sub = new Subscription();
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private router: Router,
    private taskService: TaskService
  ) {
    this.sub = this.sharedService.isClosedModal$
      .pipe(
        switchMap(dialogType => {
          const robotId = this.sharedService.currentRobotId.value;
          return this.taskService.getRobotStatusJobId(robotId).pipe(
            map(jobRefId => {
              return { jobRefId, dialogType };
            })
          );
        })
      )
      .subscribe(data => {
        const { dialogType, jobRefId } = data;
        if (dialogType === 'confirmation-dialog') {
          const data: TaskConfig = {
            jobId: jobRefId ? jobRefId : null,
            taskItemList: [
              {
                movement: {
                  waypointName: this.selectedWaypoint.name
                }
              }
            ]
          };
          this.waypointService.sendTask(data).subscribe(() => {
            this.router.navigate(['/waypoint/destination']);
          });
        }
      });
  }

  ngOnInit() {}

  onSelectedWaypoint(waypoint: Waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onSubmitModel(selectedWaypoint: Waypoint) {
    if (selectedWaypoint) {
      this.sharedService.isOpenModal$.next({
        modal: 'confirmation-dialog',
        modalHeader: '',
        isDisableClose: true,
        metaData: {
          message: 'destinationReminding',
          submitButtonName: 'start',
          height: '150px',
          width: '150px',
          fontSize: '42px',
          component: 'waypoint'
        }
      });

      //   this.waypointService.sendTask(data).subscribe(() =>
      //     this.router.navigate(['/waypoint/destination'], {
      //       queryParams: { waypointName: selectedWaypoint }
      //     })
      //   );
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
