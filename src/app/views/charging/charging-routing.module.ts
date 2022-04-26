import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DockingComponent } from './docking/docking.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'charging' },
    children: [
      {
        path: '',
        redirectTo: 'charging-dialog',
      },
      {
        path: 'charging-dialog',
        data: { title: 'charging-dialog' },
        component: DockingComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChargingRoutingModule {}
