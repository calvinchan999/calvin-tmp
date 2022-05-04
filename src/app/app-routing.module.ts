import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { DefaultComponent } from './layouts/default/default.component';
import { HomeComponent } from './views/home/home.component';
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
        canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/map/map.module').then((m) => m.MapModule),
      },
      {
        path: 'mode',
        data: { title: 'mode' },
        canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/mode/mode.module').then((m) => m.ModeModule),
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
        canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/charging/charging.module').then(
            (m) => m.ChargingModule
          ),
      },
      {
        path: 'localization',
        canActivateChild: [AuthGuard],
        data: { title: 'localization' },
        loadChildren: () =>
          import('./views/localization/localization.module').then(
            (m) => m.LocalizationModule
          ),
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
