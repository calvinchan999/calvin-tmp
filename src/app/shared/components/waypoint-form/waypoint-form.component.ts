import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { map, mergeMap, tap, take } from 'rxjs/operators';
import {
  WaypointService,
  Waypoint,
  TaskConfig
} from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrls: ['./waypoint-form.component.scss']
})
export class WaypointFormComponent implements OnInit, OnDestroy {
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
    private router: Router
  ) {
    // this.sub = this.sharedService.currentMode$.subscribe((mode) =>
    //   console.log(mode)
    // );
    // this.sub.add(
    //   this.sharedService.currentManualStatus$.subscribe((manual) =>
    //     console.log(manual)
    //   )
    // );
  }

  ngOnInit() {}

  onSelectedWaypoint(waypoint: Waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onSubmitModel(selectedWaypoint: Waypoint) {
    if (selectedWaypoint) {
      const data: TaskConfig = {
        taskItemList: [
          {
            movement: {
              waypointName: selectedWaypoint
            }
          }
        ]
      };
      // this.sharedService.isOpenModal$.next({
      //   modal: 'final-destination-dialog',
      //   modalHeader: 'finalDestination',
      //   isDisableClose: true,
      //   metaData: data,
      //   closeAfterRefresh: false,
      // });

      this.waypointService.sendTask(data).subscribe(() =>
        this.router.navigate(['/waypoint/destination'], {
          queryParams: { waypointName: selectedWaypoint }
        })
      );
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
