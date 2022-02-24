import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { mergeMap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';

@Component({
  selector: 'app-sos-form',
  templateUrl: './sos-form.component.html',
  styleUrls: ['./sos-form.component.scss'],
})
export class SosFormComponent implements OnInit {
  constructor(
    private modalComponent: ModalComponent,
    private mqttService: MqttService,
    private sharedService: SharedService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {}

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel() {

    
    //todo, mock payload for testing
    const topic: string = 'rvautotech/fobo/sos';
    const payload: string = "{ sos: true }";
    this.mqttService.unsafePublish(topic, payload).pipe(mergeMap(() => this.translateService.get('sosDialog.tips2'))).subscribe((tip2) => {
      this.modalComponent.closeTrigger$.next();
      this.sharedService.response$.next({
        type: 'normal',
        message: tip2,
      });
    });
  }
}
