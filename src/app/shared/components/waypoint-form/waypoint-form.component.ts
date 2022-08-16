import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, iif, of, Subscription } from 'rxjs';
import { map, mergeMap, tap, delay } from 'rxjs/operators';
import {
  WaypointService,
  Waypoint,
  TaskConfig
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import {
  SharedService,
  WaypointPageCategory
} from 'src/app/services/shared.service';
import { Category } from '../../utils/map-wrapper/interface/map-wrapper';
import { MapResponse, MapService } from 'src/app/views/services/map.service';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss']
})
export class WaypointFormComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedWaypoint: Waypoint;
  sub = new Subscription();

  waypointPageCategory: string;
  mapEditingType = Category.WAYPOINTSELECTOR;
  floorPlanPayload;
  waypointLists;
  floorPlanImage;
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private router: Router,
    private mapService: MapService
  ) {
    this.sub = this.sharedService.waypointListPageMode$
      .pipe(
        tap((type: number) => {
          this.waypointPageCategory = WaypointPageCategory[type];
        })
      )
      .subscribe();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.mapService
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
              })
              .pipe(
                mergeMap(data =>
                  this.mapService.getFloorPlanImage(data.floorPlanCode).pipe(
                    tap(floorPlanImage => {
                      const reader = new FileReader();
                      reader.readAsDataURL(floorPlanImage);
                      reader.onloadend = () => {
                        this.floorPlanImage = reader.result;
                      };
                    }),
                    tap(result => (this.floorPlanPayload = result)),
                    map(() => data)
                  )
                ),

                map(data => {
                  const { pointList, mapList } = data;
                  if (mapList[0]['pointList']?.length > 0) {
                    return mapList[0]['pointList'].map(ros => {
                      let splitName = null;
                      const floorPlanPointer = pointList.filter(
                        s => s.pointCode === ros.pointCode
                      )[0];
                      if (floorPlanPointer) {
                        splitName = floorPlanPointer.pointCode.split('%');
                      }

                      return {
                        ...ros,
                        ...{
                          floorPlanX: floorPlanPointer.guiX,
                          floorPlanY: floorPlanPointer.guiY,
                          floorPlanName: splitName[1] ?? splitName[0],
                          floorPlanCode: floorPlanPointer.pointCode
                        }
                      };
                    });
                  }
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

  onSubmitModel(selectedWaypoint: Waypoint) {
    if (selectedWaypoint) {
      const { pointCode } = selectedWaypoint;
      const data: TaskConfig = {
        taskItemList: [
          {
            movement: {
              waypointName: pointCode
            }
          }
        ]
      };
      // const payload = JSON.stringify({
      //   targetX: this.selectedWaypoint?.floorPlanX, // this.selectedWaypoint?.floorPlanX
      //   targetY: this.selectedWaypoint?.floorPlanY, // this.selectedWaypoint?.floorPlanY
      //   targetCode: this.selectedWaypoint?.floorPlanCode // this.selectedWaypoint?.floorPlanCode
      // });
      this.waypointService
        .sendTask(data)
        .subscribe(() => this.router.navigate(['/waypoint/destination']));
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
