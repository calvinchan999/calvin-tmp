import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from './components/card/card.component';
import { ModalComponent } from './components/modal/modal.component';
import { DestinationComponent } from './components/destination/destination.component';
import { ChargingComponent } from './components/charging/charging.component';
import { DockingFormComponent } from './components/docking-form/docking-form.component';
import { MapFormComponent } from './components/map-form/map-form.component';
import { LocalizationFormComponent } from './components/localization-form/localization-form.component';
import { ModeFormComponent } from './components/mode-form/mode-form.component';
import { SosFormComponent } from './components/sos-form/sos-form.component';
import { WaypointFormComponent } from './components/waypoint-form/waypoint-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { MapWrapperComponent } from './utils/map-wrapper/map-wrapper.component';
import { TextboxComponent } from './components/textbox/textbox.component';
import { SignOutFormComponent } from './components/sign-out-form/sign-out-form.component';
import { PairingPairComponent } from './components/pairing-pair/pairing-pair.component';
import { PairingUnpairComponent } from './components/pairing-unpair/pairing-unpair.component';
import { FollowMeInspectorDialogComponent } from './components/follow-me-inspector-dialog/follow-me-inspector-dialog.component';
import { FinalDestinationDialogComponent } from './components/waypoint-form/final-destination-dialog/final-destination-dialog.component';
import { SignInFormComponent } from './components/sign-in-form/sign-in-form.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RobotGroupFormComponent } from './components/robot-group-form/robot-group-form.component';
import { RobotListComponent } from './components/robot-list/robot-list.component';
import { RobotPairingDialogComponent } from './components/robot-pairing-dialog/robot-pairing-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    DragDropModule
  ],
  declarations: [
    HeaderComponent,
    FooterComponent,
    CardComponent,
    ModalComponent,
    DestinationComponent,
    ChargingComponent,
    DockingFormComponent,
    LocalizationFormComponent,
    MapFormComponent,
    ModeFormComponent,
    SosFormComponent,
    WaypointFormComponent,
    MapWrapperComponent,
    TextboxComponent,
    SignOutFormComponent,
    PairingPairComponent,
    PairingUnpairComponent,
    FollowMeInspectorDialogComponent,
    FinalDestinationDialogComponent,
    SignInFormComponent,
    ConfirmationDialogComponent,
    RobotGroupFormComponent,
    RobotListComponent,
    RobotPairingDialogComponent
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    CardComponent,
    ModalComponent,
    DestinationComponent,
    ChargingComponent,
    DockingFormComponent,
    LocalizationFormComponent,
    MapFormComponent,
    ModeFormComponent,
    SosFormComponent,
    WaypointFormComponent,
    MapWrapperComponent,
    TextboxComponent,
    SignOutFormComponent,
    PairingPairComponent,
    PairingUnpairComponent,
    FollowMeInspectorDialogComponent,
    FinalDestinationDialogComponent,
    SignInFormComponent,
    ConfirmationDialogComponent,
    RobotGroupFormComponent,
    RobotListComponent,
    RobotPairingDialogComponent
  ],
  providers: [ModalComponent]
})
export class SharedModule {}
