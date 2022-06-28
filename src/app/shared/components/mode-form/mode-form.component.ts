import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { ModeService, Mode } from 'src/app/views/services/mode.service';

@Component({
  selector: 'app-mode-form',
  templateUrl: './mode-form.component.html',
  styleUrls: ['./mode-form.component.scss'],
})
export class ModeFormComponent implements OnInit {
  modeLists$: Observable<any> = of([
    { name: 'followMe', value: 'FOLLOW_ME', icon: 'account-arrow-left' },
    { name: 'navigation', value: 'NAVIGATION', icon: 'sync' },
  ]);
  selectedMode: Mode;
  currentMode: string;
  constructor(
    private modalComponent: ModalComponent,
    private modeService: ModeService,
    private sharedService: SharedService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.sharedService.currentMode$.subscribe(
      (mode) => (this.currentMode = mode)
    );
  }

  onSelectedMode(mode: Mode) {
    this.selectedMode = mode;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(selectedMode: Mode) {
    if (selectedMode === Mode.NAVIGATION) {
      this.modeService.changeMode(selectedMode).subscribe(() => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: 'normal',
          message: 'modeDialog.tips1',
        });
      });
    } else if (selectedMode === Mode.FOLLOW_ME) {
      this.sharedService.isOpenModal$.next({
        modal: 'follow-me-inspector',
        modalHeader: 'followMeInspector',
        isDisableClose: true,
      });
    }
  }

  tranlateModeName(name: string): Observable<string> {
    return this.translateService.get(`robotStatus.${name}`);
  }
}
