import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, iif, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import {
  SharedService,
  WaypointPageCategory
} from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapResponse, MapService } from 'src/app/views/services/map.service';
import {
  WaypointService,
  Waypoint,
  TaskConfig
} from 'src/app/views/services/waypoint.service';
import { Category } from '../../utils/map-wrapper/interface/map-wrapper';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss']
})
export class WaypointFormComponent implements OnInit {
  type: WaypointPageCategory;
  toolType = Category.WAYPOINTSELECTOR;
  floorPlanSubject$: BehaviorSubject<any> = new BehaviorSubject<string>('');
  waypointLists = null;

  selectedWaypoint: Waypoint;
  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private sharedService: SharedService,
    private modalComponent: ModalComponent,
    private router: Router
  ) {
    this.sharedService.waypointListPageMode$
      .pipe(
        tap(type => {
          this.type = type;
        })
      )
      .subscribe();
  }

  ngOnInit() {
    this.mapService
      .getActiveMap()
      .pipe(
        mergeMap((currentMap: MapResponse) =>
          iif(
            () => !!currentMap.name,
            this.mapService
              .getFloorPlanData({
                code: currentMap.name,
                floorPlanIncluded: true,
                mapIncluded: false
              })
              .pipe(
                map(data => {
                  const { floorPlanPointList, rosMapPointList } = data;

                  if (data?.imageData) {
                    this.floorPlanSubject$.next(data);
                  }
                  return rosMapPointList.map(ros => {
                    const floorPlanPointer = floorPlanPointList.filter(
                      s => s.name === ros.name
                    )[0];
                    return {
                      ...ros,
                      ...{
                        floorPlanX: floorPlanPointer.x,
                        floorPlanY: floorPlanPointer.y,
                        floorPlanName: floorPlanPointer.name,
                        floorPlanCode: floorPlanPointer.code
                      }
                    };
                  });
                })
              ),
            of(null)
          )
        )
      )
      .subscribe(data => {
        this.waypointLists = data;
      });
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
              waypointName: selectedWaypoint.code // todo
            }
          }
        ]
      };
      this.waypointService.sendTask(data).subscribe(() => {
        const payload = JSON.stringify({
          targetX: this.selectedWaypoint?.x, // this.selectedWaypoint?.floorPlanX
          targetY: this.selectedWaypoint?.y, // this.selectedWaypoint?.floorPlanY
          targetCode: this.selectedWaypoint?.code // this.selectedWaypoint?.floorPlanCode
        });
        this.router.navigate(['/waypoint/destination'], {
          queryParams: {
            payload
          }
        });
      });
    }
  }
}
