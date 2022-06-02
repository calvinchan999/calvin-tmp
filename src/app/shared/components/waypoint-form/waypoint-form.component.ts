import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { iif, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapResponse, MapService } from 'src/app/views/services/map.service';
import {
  WaypointService,
  Waypoint,
  TaskConfig,
} from 'src/app/views/services/waypoint.service';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss'],
})
export class WaypointFormComponent implements OnInit {
  waypointLists$: Observable<any> = this.mapService
  .getActiveMap()
  .pipe(
    mergeMap((currentMap: MapResponse) =>
      iif(
        () => !!currentMap.name,
        this.mapService
        .getFloorPlanData({
          code: currentMap.name,
          floorPlanIncluded: false,
          mapIncluded: false
        }).pipe(map(data => data.pointList)),
        of(null)
      )
    )
  );
  selectedWaypoint: Waypoint;
  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private modalComponent: ModalComponent,
    private router: Router
  ) {}

  ngOnInit() {

    
  }

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
      this.waypointService
        .sendTask(data)
        .subscribe(() => {
          // this.sharedService.isOpenModal$.next({
          //   modal: 'destination',
          //   modalHeader: navigatingtoDestination,
          //   isDisableClose: false,
          //   payload: {
          //     targetX: this.selectedWaypoint?.x,
          //     targetY: this.selectedWaypoint?.y,
          //     targetAngle: this.selectedWaypoint?.angle,
          //   }
          // });

          // this.sharedService.isGoingDestination$.next(true);
          // this.sharedService.response$.next('模式已更新');

          const payload = JSON.stringify({
            targetX: this.selectedWaypoint?.x,
            targetY: this.selectedWaypoint?.y,
            // targetAngle: this.selectedWaypoint?.angle,
            targetCode: this.selectedWaypoint?.code
          });
          this.router.navigate(['/waypoint/destination'], {
            queryParams: {
              payload,
            },
          });
        });
    }
  }
}
