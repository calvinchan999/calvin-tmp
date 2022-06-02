// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  remoteConfig: true,
  remoteConfigUrl: 'assets/config/dashboard-config.json',
  api_token: 'f05914ea33124ba7a6cab301627c8adf',
  api: {
    auth: '/api/authentication/v1/login',
    refreshAuth: '/api/authentication/v1/refresh',
    task: '/api/task/v1/move',
    followMe: '/api/mode/v1/followMe',
    navigation: '/api/mode/v1/navigation',
    mode: '/api/mode/v1',
    map: '/api/map/v1',
    activeMap: '/api/map/v1/activeMap',
    changeMap: '/api/map/v1/change/',
    waypoint: '/api/waypoint/v1',
    pause: '/api/baseControl/v1/pause',
    resume: '/api/baseControl/v1/resume',
    localization: '/api/localization/v1',
    initialPose: '/api/localization/v1/initialPose',
    localizationPose: '/api/localization/v1/pose',
    docking: '/api/docking/v1/charging',
    mapImage: (map: string) => `/api/map/v1/${map}/image`,
    mapMetaData: (map: string) => `/api/map/v1/${map}/mapMetadata`,
    lidar: '/api/lidar/v1',
    floorPlans: '/api/floorPlan/v1',
    floorPlanByMapCode: (code: string) => `/api/floorPlan/v1/mapCode/${code}`,
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
