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
        return of(null).pipe(
          tap(() => {
            const ob$: Observable<any> = this.sharedService.isOpenModal$; // hot to cold obserable
            ob$
              .pipe(
                take(1),
                tap(data => {
                  const { modal } = data;
                  if (modal === 'confirmation-dialog') {
                    this.sharedService.isOpenModal$.next({
                      modal: null,
                      modalHeader: null
                    });
                  }
                })
              )
              .subscribe(() => this.router.navigate(['/']));
          })
        );
      }
    })
  );

  selectedWaypoint: Waypoint;
  sub = new Subscription();
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit() {
    // this.sharedService.response$.next({
    //   type: 'normal',
    //   message: 'destinationReminding'
    // });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sharedService.isOpenModal$.next({
        modal: 'confirmation-dialog',
        modalHeader: '',
        isDisableClose: true,
        metaData: { message: 'destinationReminding', submitButtonName: 'start' }
      });
    }, 0);
  }

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
