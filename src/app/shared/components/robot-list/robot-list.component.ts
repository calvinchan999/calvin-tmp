import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-robot-list',
  templateUrl: './robot-list.component.html',
  styleUrls: ['./robot-list.component.scss']
})
export class RobotListComponent implements OnInit {
  @Input() robotListsOb: Observable<any> = EMPTY;
  @Output() selectedRobotsEvent = new EventEmitter<any>();
  selectedRobots: Array<any> = [];

  constructor() {}

  ngOnInit(): void {}

  isRobotSelected(robot) {
    return (
      this.selectedRobots.find(
        selectedRobot => selectedRobot.robotCode === robot.robotCode
      ) !== undefined
    );
  }

  onSelectedRobot(robot) {
    const index = this.selectedRobots.findIndex(
      selectedRobot => selectedRobot.robotCode === robot.robotCode
    );

    if (index === -1) {
      this.selectedRobots.push(robot);
    } else {
      this.selectedRobots.splice(index, 1);
    }

    this.selectedRobotsEvent.emit(this.selectedRobots);
  }
}
