import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from './map.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'map' },
    children: [
      {
        path: '',
        data: { title: 'map' },
        component: MapComponent,
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapRoutingModule { }
