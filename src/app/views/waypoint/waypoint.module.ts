import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WaypointRoutingModule } from './waypoint-routing.module';
import { WaypointDestinationComponent } from './waypoint-destination/waypoint-destination.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { WaypointListComponent } from './waypoint-list/waypoint-list.component';


@NgModule({
  declarations: [
    WaypointDestinationComponent,
    WaypointListComponent
  ],
  imports: [
    CommonModule,
    WaypointRoutingModule,
    SharedModule
  ]
})
export class WaypointModule { }
