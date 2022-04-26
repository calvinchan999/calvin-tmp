import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChargingRoutingModule } from './charging-routing.module';
import { DockingComponent } from './docking/docking.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    DockingComponent
  ],
  imports: [
    CommonModule,
    ChargingRoutingModule,
    SharedModule
  ]
})
export class ChargingModule { }
