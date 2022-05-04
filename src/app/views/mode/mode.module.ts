import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModeRoutingModule } from './mode-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ModeRoutingModule,
    SharedModule,
    TranslateModule,
  ]
})
export class ModeModule { }
