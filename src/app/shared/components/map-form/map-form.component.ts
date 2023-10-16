import { Component, OnInit } from '@angular/core';
import { EMPTY, Observable, Subject, iif, of } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapRequest, MapService } from 'src/app/views/services/map.service';
import * as _ from 'lodash';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-map-form',
  templateUrl: './map-form.component.html',
  styleUrls: ['./map-form.component.scss']
})
export class MapFormComponent implements OnInit {
  mapLists$: Observable<any> = this.mapService.getMap();
  waypointLists$;
  selectedMap: string;
  selectedWaypoint: string;
  clickEvent$ = new Subject();
  next: boolean = false;
  constructor(
    private modalComponent: ModalComponent,
    private mapService: MapService,
    private waypointService: WaypointService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.clickEvent$
      .pipe(
        switchMap(() =>
          iif(
            () => !!this.selectedMap,
            of(EMPTY).pipe(
              switchMap(() => {
                if (this.selectedMap) {
                  const param = _.pickBy(
                    { mapName: this.selectedMap, initialLocalization: 'true' },
                    _.identity
                  );
                  const queries = { param };
                  return this.waypointService.getWaypoint(queries).pipe(
                    tap(waypointLists => {
                      this.next = true;
                      this.waypointLists$ = of(waypointLists);
                    }),
                    switchMap(() => of(EMPTY))
                  );
                } else {
                  return of(EMPTY);
                }
              })
            ),
            of(EMPTY)
          )
        )
      )
      .subscribe();
  }

  onSelectedMap(map) {
    this.selectedMap = map;
  }

  onSelectedWaypoint(waypoint) {
    this.selectedWaypoint = waypoint;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(mapName, waypointName) {
    if (mapName && waypointName) {
      const data: MapRequest = {
        mapName,
        waypointName,
        useInitialPose: true
      };
      this.mapService.changeMap(data).subscribe(() => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: 'normal',
          message: 'mapDialog.tips1'
        });
      });
    }
  }

  onSubmitMap() {
    this.clickEvent$.next();
  }
}
