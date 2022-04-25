import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WaypointRoutingModule } from './waypoint-routing.module';
import { WaypointDestinationComponent } from './waypoint-destination/waypoint-destination.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    WaypointDestinationComponent
  ],
  imports: [
    CommonModule,
    WaypointRoutingModule,
    SharedModule
  ]
})
export class WaypointModule { }
