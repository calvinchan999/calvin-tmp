import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
// import { HomeComponent } from 'src/app/views/home/home.component';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
  ],
  declarations: [DefaultComponent]
})
export class DefaultModule { }
