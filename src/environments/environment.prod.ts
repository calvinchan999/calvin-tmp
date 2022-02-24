export const environment = {
  production: true,
  remoteConfig: true,
  remoteConfigUrl: 'assets/config/dashboard-config-prod.json',
  api_token: "f05914ea33124ba7a6cab301627c8adf",
  api: {
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
    docking: '/api/docking/v1/charging'
  },
};
