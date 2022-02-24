import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { mergeMap, tap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/services/app-config.service';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { DockingService } from 'src/app/views/services/docking.service';

@Component({
  selector: 'app-docking-form',
  templateUrl: './docking-form.component.html',
  styleUrls: ['./docking-form.component.scss'],
})
export class DockingFormComponent implements OnInit {
  constructor(
    private modalComponent: ModalComponent,
    private dockingService: DockingService,
    private sharedService: SharedService,
    private appConfigService: AppConfigService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {}

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel() {
    const { duration, upperLimit } = this.appConfigService.getConfig().battery;
    const data = {
      upperLimit,
      duration,
    };

    // this.dockingService.startdocking(data).pipe(mergeMap(() => this.translateService.get("dockingDialog.tips2")), tap((tip2)=> {
    //   this.modalComponent.closeTrigger$.next();
    //   this.sharedService.response$.next({
    //     type: 'warning',
    //     message: tip2,
    //   });
    // })).subscribe();

    this.translateService.get("dockingDialog.tips2").pipe(tap(tip2 => {
      this.sharedService.response$.next({
        type: 'warning',
        message: tip2,
      });
    }), mergeMap(() => this.dockingService.startdocking(data))).subscribe(() => this.modalComponent.closeTrigger$.next());
  }
}
