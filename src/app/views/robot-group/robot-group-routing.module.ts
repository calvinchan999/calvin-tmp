import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RobotGroupComponent } from './robot-group.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'followRobotGroup' },
    children: [
      {
        path: '',
        redirectTo: 'robot-group',
      },
      {
        path: 'robot-group',
        data: { title: 'followRobotGroup' },
        component: RobotGroupComponent,
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RobotGroupRoutingModule { }
