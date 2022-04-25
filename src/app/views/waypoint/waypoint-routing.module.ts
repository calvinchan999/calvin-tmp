import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WaypointDestinationComponent } from './waypoint-destination/waypoint-destination.component';

import { WaypointListComponent } from './waypoint-list/waypoint-list.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'waypoint' },
    children: [
      {
        path: '',
        redirectTo: 'waypoint-list',
      },
      {
        path: 'waypoint-list',
        data: { title: 'waypoint-list' },
        component: WaypointListComponent,
      },
      {
        path: 'destination',
        data: { title: 'destination' },
        component: WaypointDestinationComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WaypointRoutingModule {}
