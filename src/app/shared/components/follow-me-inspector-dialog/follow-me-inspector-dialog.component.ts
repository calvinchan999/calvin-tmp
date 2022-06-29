import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { ModeService, Mode } from 'src/app/views/services/mode.service';
import { ModalComponent } from '../modal/modal.component';
import { mergeMap, switchMap } from 'rxjs/operators';
import { MapService } from 'src/app/views/services/map.service';
import { iif, of } from 'rxjs';

@Component({
  selector: 'app-follow-me-inspector-dialog',
  templateUrl: './follow-me-inspector-dialog.component.html',
  styleUrls: ['./follow-me-inspector-dialog.component.scss'],
})
export class FollowMeInspectorDialogComponent implements OnInit {
  constructor(
    private modeService: ModeService,
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {}

  onSubmitMap() {
    this.mapService
      .getActiveMap()
      .pipe(
        mergeMap((map) => {
          return iif(
            () => !!map?.name,
            this.modeService.followMeWithMap(map?.name).pipe(
              switchMap(() =>
                of(
                  this.sharedService.response$.next({
                    type: 'normal',
                    message: 'modeDialog.tips1',
                  })
                )
              ),
              mergeMap(() => of(this.modalComponent.closeTrigger$.next()))
            ),
            of(
              this.sharedService.response$.next({
                type: 'warning',
                message: 'mapNotFoundError',
              })
            )
          );
        })
      )
      .subscribe();
  }

  onSubmitWithoutMap() {
    this.modeService.changeMode(Mode.FOLLOW_ME).subscribe(() => {
      this.modalComponent.closeTrigger$.next();
      this.sharedService.response$.next({
        type: 'normal',
        message: 'modeDialog.tips1',
      });
    });
  }
}
