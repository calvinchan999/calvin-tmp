import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DefaultModule } from './layouts/default/default.module';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { HomeComponent } from './views/home/home.component';
import { AppConfigService } from './services/app-config.service';
import { environment } from 'src/environments/environment';
import { AppHttpInterceptor } from './http/app-http.interceptor';
import { HttpStatusInterceptor } from './http/http-status.interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { MqttModule } from 'ngx-mqtt';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MapComponent } from './views/map/map.component';
import { ModeComponent } from './views/mode/mode.component';
import { MatIconModule } from '@angular/material/icon';
import { WaypointListComponent } from './views/waypoint/waypoint-list/waypoint-list.component';
import { ToastrModule } from 'ngx-toastr';
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

const appInitializerFn = (appConfig: AppConfigService) => {
  return async () => {
    if (environment.remoteConfig) {
      console.log(
        '### AppConfigService APP-MODULE-TS appInitializerFn environment.remoteConfig',
        environment.remoteConfig
      );
      await appConfig.loadAppConfig();
      console.log('### AppConfigService APP-MODULE-TS appConfig loaded');
      return;
    }
  };
};

@NgModule({
  declarations: [AppComponent, HomeComponent, MapComponent, ModeComponent, WaypointListComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DefaultModule,
    HttpClientModule,
    RouterModule,
    SharedModule,
    NgxSpinnerModule,
    BrowserAnimationsModule,
    MqttModule.forRoot({}),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    MatIconModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-full-width',
      preventDuplicates: true,
      disableTimeOut: true
    })
  ],
  providers: [
    HttpClientModule,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpStatusInterceptor,
      multi: true,
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
