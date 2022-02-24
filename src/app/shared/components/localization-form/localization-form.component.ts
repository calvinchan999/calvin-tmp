import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { type } from 'os';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import {
  WaypointService,
  Waypoint,
} from 'src/app/views/services/waypoint.service';

@Component({
  selector: 'app-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
})
export class LocalizationFormComponent implements OnInit {
  waypointLists$: Observable<any> = this.sharedService.currentMap$.pipe(mergeMap((map: any) => this.waypointService.getWaypoint(map)));
  selectedWaypoint: Waypoint;
  constructor(
    private modalComponent: ModalComponent,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
 
  }

  onSelectedWaypoint(selectedWaypoint: Waypoint) {
    this.selectedWaypoint = selectedWaypoint;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  // todo
  onSubmitModel(selectedWaypoint: Waypoint) {
    console.log(selectedWaypoint);
    this.waypointService
      .localize(selectedWaypoint)
      .pipe(
        mergeMap((res) => {
          if (res.success) {
            return this.translateService
              .get('localizationDialog.successMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: msg,
                  };
                })
              );
          } else {
            return this.translateService
              .get('localizationDialog.failedMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: `${msg} \n ${res?.message}`,
                  };
                })
              );
          }
        })
      )
      .subscribe((res: { type: any; message: string }) => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: res.type,
          message: res.message,
        });
      });
  }
}
