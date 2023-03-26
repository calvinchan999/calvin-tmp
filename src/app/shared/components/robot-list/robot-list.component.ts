import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-robot-list',
  templateUrl: './robot-list.component.html',
  styleUrls: ['./robot-list.component.scss']
})
export class RobotListComponent implements OnInit {
  @Input() robots;
  @Output() selectedRobotEvent = new EventEmitter<any>();
  selectedRobots: Array<any> = [];
  
  constructor() {}

  ngOnInit() {}

  isRobotSelected(robot) {
    return (
      this.selectedRobots.find(
        selectedRobot => selectedRobot.robotCode === robot.robotCode
      ) !== undefined
    );
  }

  onEvent(robot) {
    const index = this.selectedRobots.findIndex(
      selectedRobot => selectedRobot.robotCode === robot.robotCode
    );

    if (index === -1) {
      this.selectedRobots.push(robot);
    } else {
      this.selectedRobots.splice(index, 1);
    }

    this.selectedRobotEvent.emit(this.selectedRobots);
  }
}
