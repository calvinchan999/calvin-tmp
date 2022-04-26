import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from './layouts/default/default.component';
import { HomeComponent } from './views/home/home.component';
import { MapComponent } from './views/map/map.component';
import { ModeComponent } from './views/mode/mode.component';
import { WaypointListComponent } from './views/waypoint/waypoint-list/waypoint-list.component';


const routes: Routes = [
  { path: '', redirectTo: 'hong-chi', pathMatch: 'full' },
  {
    path: 'hong-chi',
    component: DefaultComponent,
    children: [
      {
        path: '',
        data: { title: "home" },
        component: HomeComponent,
      },
      {
        path: 'map',
        data: { title: "Current Map" },
        component: MapComponent,
      },
      {
        path: 'mode',
        data: { title: "Mode" },
        component: ModeComponent,
      },
      {
        path: 'waypoint',
        loadChildren: () => import('./views/waypoint/waypoint.module').then(m => m.WaypointModule)
      },
      {
        path: 'charging',
        loadChildren: () => import('./views/charging/charging.module').then(m => m.ChargingModule)
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
