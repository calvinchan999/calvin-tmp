import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DefaultModule } from './layouts/default/default.module';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { HomeComponent } from './views/home/home.component';
import { AppConfigService } from './services/app-config.service';
import { environment } from 'src/environments/environment';
import { AppHttpInterceptor } from './http/app-http.interceptor';
import { HttpStatusInterceptor } from './http/http-status.interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ToastrModule } from 'ngx-toastr';

import { SignInComponent } from './views/sign-in/sign-in.component';
import { CameraComponent } from './views/camera/camera.component';
import { WebcamModule } from 'ngx-webcam';
// import { RobotGroupComponent } from './views/robot-group/robot-group.component';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}
// const config: Config = AppConfigService.getConfig();

const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  connectOnCreate: false
};

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

const dbConfig: DBConfig = {
  name: 'RvDb',
  version: 1,
  objectStoresMeta: [
    {
      store: 'map',
      storeConfig: { keyPath: 'name', autoIncrement: false },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'type', keypath: 'type', options: { unique: false } },
        { name: 'payload', keypath: 'payload', options: { unique: false } }
      ]
    },
    {
      store: 'errorLogs',
      storeConfig: { keyPath: 'createdAt', autoIncrement: false },
      storeSchema: [
        { name: 'error', keypath: 'createdAt', options: { unique: false } },
        { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
      ]
    }
  ]
};

@NgModule({
  declarations: [AppComponent, HomeComponent, SignInComponent, CameraComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DefaultModule,
    HttpClientModule,
    RouterModule,
    SharedModule,
    NgxSpinnerModule,
    BrowserAnimationsModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-full-width',
      preventDuplicates: true
      // disableTimeOut: true,
    }),
    HammerModule,
    WebcamModule,
    NgxIndexedDBModule.forRoot(dbConfig)
  ],
  providers: [
    HttpClientModule,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpStatusInterceptor,
      multi: true
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
