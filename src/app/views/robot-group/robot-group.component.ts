import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-robot-group',
  templateUrl: './robot-group.component.html',
  styleUrls: ['./robot-group.component.scss']
})
export class RobotGroupComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  onEvent(event: Event) {
    console.log(event);
  }
}
