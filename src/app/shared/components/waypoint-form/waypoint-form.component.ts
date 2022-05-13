import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
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
  waypointLists$: Observable<any> = this.mapService.getActiveMap().pipe(
    mergeMap((currentMap: MapResponse) => {
      return this.waypointService.getWaypoint(currentMap.name);
    })
  );
  selectedWaypoint: Waypoint;
  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {}

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
      console.log(`selectedWaypoint${selectedWaypoint}`);
      console.log(this.selectedWaypoint);
      this.waypointService
        .sendTask(data)
        .pipe(
          // mergeMap(() => this.translateService.get('navigatingtoDestination'))
        )
        .subscribe((navigatingtoDestination) => {
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
          const payload = JSON.stringify({
            targetX: this.selectedWaypoint?.x,
            targetY: this.selectedWaypoint?.y,
            targetAngle: this.selectedWaypoint?.angle,
          });
          this.router.navigate(['/waypoint/destination'], {
            queryParams: {
              payload,
            },
          });
          // this.sharedService.isGoingDestination$.next(true);
          // this.sharedService.response$.next('模式已更新');
        });
    }
  }
}
