import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AppConfigService } from 'src/app/services/app-config.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { DockingService } from 'src/app/views/services/docking.service';

@Component({
  selector: 'app-docking-form',
  templateUrl: './docking-form.component.html',
  styleUrls: ['./docking-form.component.scss']
})
export class DockingFormComponent implements OnInit {
  @Output() isUpdate = new EventEmitter<boolean>(false);
  constructor(
    private modalComponent: ModalComponent,
    private dockingService: DockingService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {}

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel() {
    const { duration, upperLimit } = this.appConfigService.getConfig().battery;
    const data = {
      upperLimit,
      duration
    };

    this.dockingService
      .startdocking(data)
      .subscribe(() => this.isUpdate.emit(true));
  }
}
