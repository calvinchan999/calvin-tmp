import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { DefaultComponent } from './layouts/default/default.component';
import { HomeComponent } from './views/home/home.component';
import { SignInComponent } from './views/sign-in/sign-in.component';
import { CameraComponent } from './views/camera/camera.component';
import { VideoCallComponent } from './views/video-call/video-call.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    component: DefaultComponent,
    children: [
      {
        path: 'dashboard',
        data: { title: 'dashboard' },
        component: HomeComponent
      },
      {
        path: 'map',
        data: { title: 'currentMap' },
        canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/map/map.module').then(m => m.MapModule)
      },
      {
        path: 'mode',
        data: { title: 'mode' },
        canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/mode/mode.module').then(m => m.ModeModule)
      },
      {
        path: 'waypoint',
        loadChildren: () =>
          import('./views/waypoint/waypoint.module').then(m => m.WaypointModule)
      },
      {
        path: 'charging',
        // canActivateChild: [AuthGuard],
        loadChildren: () =>
          import('./views/charging/charging.module').then(m => m.ChargingModule)
      },
      {
        path: 'localization',
        canActivateChild: [AuthGuard],
        data: { title: 'localization' },
        loadChildren: () =>
          import('./views/localization/localization.module').then(
            m => m.LocalizationModule
          )
      },
      {
        path: 'robot-group',
        canActivateChild: [AuthGuard],
        data: { title: 'followRobotGroup' },
        loadChildren: () =>
          import('./views/robot-group/robot-group.module').then(
            m => m.RobotGroupModule
          )
      },
      {
        path: 'login',
        data: { title: 'signIn' },
        component: SignInComponent
      },
      {
        path: 'camera',
        data: { title: 'camera' },
        component: CameraComponent
      },
      {
        path: 'video-call',
        data: { title: 'video-call' },
        component: VideoCallComponent
      },
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
