import { Component, Input, OnInit } from '@angular/core';
import { RobotGroupService } from 'src/app/views/services/robot-group.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-robot-pairing-dialog',
  templateUrl: './robot-pairing-dialog.component.html',
  styleUrls: ['./robot-pairing-dialog.component.scss']
})
export class RobotPairingDialogComponent implements OnInit {
  @Input() metaData;
  group: string;
  master: boolean = false;
  client: boolean = false;
  value: number = 0;

  constructor(
    private robotGroupService: RobotGroupService,
    private modalComponent: ModalComponent
  ) {}

  ngOnInit() {
    const { group, master, client, value } = this.metaData;
    this.group = group;
    this.master = master;
    this.client = client;
    this.value = value;
  }

  unpair() {
    this.robotGroupService
      .unpairRobotGroup(this.group)
      .subscribe(() => this.modalComponent.closeTrigger$.next());
  }
}
