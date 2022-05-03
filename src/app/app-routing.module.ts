import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from './layouts/default/default.component';
import { HomeComponent } from './views/home/home.component';
import { LocalizationComponent } from './views/localization/localization.component';
import { MapComponent } from './views/map/map.component';
import { ModeComponent } from './views/mode/mode.component';
import { SignInComponent } from './views/sign-in/sign-in.component';

const routes: Routes = [
  { path: '', redirectTo: 'hong-chi', pathMatch: 'full' },
  {
    path: 'hong-chi',
    component: DefaultComponent,
    children: [
      {
        path: '',
        data: { title: 'home' },
        component: HomeComponent,
      },
      {
        path: 'map',
        data: { title: 'currentMap' },
        component: MapComponent,
      },
      {
        path: 'mode',
        data: { title: 'mode' },
        component: ModeComponent,
      },
      {
        path: 'waypoint',
        loadChildren: () =>
          import('./views/waypoint/waypoint.module').then(
            (m) => m.WaypointModule
          ),
      },
      {
        path: 'charging',
        loadChildren: () =>
          import('./views/charging/charging.module').then(
            (m) => m.ChargingModule
          ),
      },
      {
        path: 'localization',
        data: { title: 'localization' },
        component: LocalizationComponent,
      },
      {
        path: 'login',
        data: { title: 'signIn' },
        component: SignInComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
