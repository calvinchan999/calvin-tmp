import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChargingMqttComponent } from './charging-mqtt/charging-mqtt.component';
import { DockingComponent } from './docking/docking.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'charging' },
    children: [
      // {
      //   path: '',
      //   redirectTo: 'charging-dialog',
      // },
      // {
      //   path: 'charging-dialog',
      //   data: { title: 'chargingDialog' },
      //   component: DockingComponent,
      // },
      {
        path: '',
        redirectTo: 'charging-mqtt',
      },
      {
        path: 'charging-mqtt',
        data: { title: 'chargingMqtt' },
        component: ChargingMqttComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChargingRoutingModule {}
