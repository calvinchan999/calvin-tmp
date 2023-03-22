import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { RobotGroupRoutingModule } from './robot-group-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { RobotGroupComponent } from './robot-group.component';


@NgModule({
  declarations: [RobotGroupComponent],
  imports: [
    CommonModule,
    SharedModule,
    RobotGroupRoutingModule,
    TranslateModule
  ]
})
export class RobotGroupModule { }
