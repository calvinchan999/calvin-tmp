import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
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
    { name: 'FOLLOW_ME' },
    { name: 'NAVIGATION' },
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
    this.modeService
      .changeMode(selectedMode)
      .pipe(mergeMap(() => this.translateService.get('modeDialog.tips1')))
      .subscribe((tips1: string) => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: 'normal',
          message: tips1,
        });
      });
  }
}
