import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { ModeService, Mode } from 'src/app/views/services/mode.service';
import { ModalComponent } from '../modal/modal.component';
import { mergeMap, switchMap } from 'rxjs/operators';
import { MapService } from 'src/app/views/services/map.service';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-follow-me-inspector-dialog',
  templateUrl: './follow-me-inspector-dialog.component.html',
  styleUrls: ['./follow-me-inspector-dialog.component.scss'],
})
export class FollowMeInspectorDialogComponent implements OnInit, OnDestroy {
  sub = new Subscription();
  constructor(
    private modeService: ModeService,
    private modalComponent: ModalComponent,
    private sharedService: SharedService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {}

  onSubmitMap() {
    this.sub = this.sharedService
      .currentMapBehaviorSubject$
      .pipe(
        switchMap((mapName) => {
          if (mapName) {
            if (mapName !== 'UNDEFINED' && mapName.length > 0) {
              return this.modeService.followMeWithMap(mapName).pipe(
                mergeMap(() =>
                  of(
                    this.sharedService.response$.next({
                      type: 'normal',
                      message: 'modeDialog.tips1',
                    })
                  )
                ),
                mergeMap(() => of(this.modalComponent.closeTrigger$.next()))
              );
            } else {
              return of(
                this.sharedService.response$.next({
                  type: 'warning',
                  message: 'mapNotFoundError',
                })
              );
            }
          } else {
            return of(null);
          }
        })
      )
      .subscribe();

    // this.mapService
    //   .getActiveMap()
    //   .pipe(
    //     switchMap((map) => {
    //       if (map) {
    //         const { name } = map;
    //         return iif(
    //           () => name !== 'UNDEFINED',
    //           this.modeService.followMeWithMap(name).pipe(
    //             mergeMap(() =>
    //               of(
    //                 this.sharedService.response$.next({
    //                   type: 'normal',
    //                   message: 'modeDialog.tips1',
    //                 })
    //               )
    //             ),
    //             mergeMap(() => of(this.modalComponent.closeTrigger$.next()))
    //           ),
    //           of(
    //             this.sharedService.response$.next({
    //               type: 'warning',
    //               message: 'mapNotFoundError',
    //             })
    //           )
    //         );
    //       } else {
    //         return of(null);
    //       }
    //     })
    //   )
    //   .subscribe();
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

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
