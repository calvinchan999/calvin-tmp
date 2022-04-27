import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChargingRoutingModule } from './charging-routing.module';
import { DockingComponent } from './docking/docking.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ChargingMqttComponent } from './charging-mqtt/charging-mqtt.component';

@NgModule({
  declarations: [DockingComponent, ChargingMqttComponent],
  imports: [CommonModule, ChargingRoutingModule, SharedModule, TranslateModule],
})
export class ChargingModule {}
