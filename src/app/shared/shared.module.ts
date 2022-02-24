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

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
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
    WaypointFormComponent
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
    WaypointFormComponent
  ],
  providers: [ModalComponent],
})
export class SharedModule {}
