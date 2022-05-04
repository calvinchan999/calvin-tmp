import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModeComponent } from './mode.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'mode' },
    children: [
      {
        path: '',
        data: { title: 'mode' },
        component: ModeComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModeRoutingModule {}
