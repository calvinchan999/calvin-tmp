import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss']
})
export class CameraComponent implements OnInit {
  allowCameraSwitch: boolean = false;
  srcHeight: number = window.innerHeight;
  srcWeight: number = window.innerWidth;
  constructor() {}

  ngOnInit(): void {}

  public handleInitError(error): void {
    if (error) {
      alert(JSON.stringify(error));
    }
  }
}
