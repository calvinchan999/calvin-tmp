import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
// import { MapResponse, MapService } from 'src/app/views/services/map.service';
import {
  WaypointService,
  Waypoint,
  TaskConfig,
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss'],
})
export class WaypointFormComponent implements OnInit {
  waypointLists$: Observable<any> = this.sharedService.currentMap$.pipe(
    mergeMap((currentMap: string) => {
      return this.waypointService.getWaypoint(currentMap).pipe(
        map((data) => {
          const dataTransfor = [];
          for (let i of data) {
            const splitName = i.name.split('%');
            dataTransfor.push({
              ...i,
              waypointName: splitName[1] ?? splitName[0],
            });
          }
          return _.orderBy(dataTransfor, 'waypointName', 'asc');
        })
      );
    })
  );

  selectedWaypoint: Waypoint;
  constructor(
    private waypointService: WaypointService,
    private modalComponent: ModalComponent,
    private router: Router,
    private sharedService: SharedService
  ) {}

  ngOnInit() {}

  onSelectedWaypoint(waypoint: Waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(selectedWaypoint: Waypoint) {
    if (selectedWaypoint) {
      const data: TaskConfig = {
        taskItemList: [
          {
            movement: {
              waypointName: selectedWaypoint,
            },
          },
        ],
      };
      this.waypointService.sendTask(data).subscribe();
    //   this.waypointService
    //     .sendTask(data)
    //     .pipe()
    //     .subscribe(() => {
    //       const payload = JSON.stringify({
    //         targetX: this.selectedWaypoint?.x,
    //         targetY: this.selectedWaypoint?.y,
    //         targetAngle: this.selectedWaypoint?.angle,
    //       });
    //       this.router.navigate(['/waypoint/destination'], {
    //         queryParams: {
    //           payload,
    //         },
    //       });
    //     });
    }
  }
}
