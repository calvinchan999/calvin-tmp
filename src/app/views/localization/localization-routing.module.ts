import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocalizationComponent } from './localization.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'localization' },
    children: [
      {
        path: '',
        data: { title: 'localization' },
        component: LocalizationComponent,
      }
    
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LocalizationRoutingModule {}
