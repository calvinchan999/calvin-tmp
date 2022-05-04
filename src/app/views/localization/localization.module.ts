import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocalizationRoutingModule } from './localization-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { LocalizationComponent } from './localization.component';

@NgModule({
  declarations: [LocalizationComponent],
  imports: [
    CommonModule,
    LocalizationRoutingModule,
    SharedModule,
    TranslateModule,
  ],
})
export class LocalizationModule {}
