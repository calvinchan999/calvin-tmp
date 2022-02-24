import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from './layouts/default/default.component';
import { HomeComponent } from './views/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'hong-chi', pathMatch: 'full' },
  {
    path: 'hong-chi',
    component: DefaultComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
    
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
