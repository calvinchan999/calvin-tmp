import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  @Input() title: string;
  @Input() icon: string;
  @Input() disable: boolean = false;
  @Output() eventTrigger = new EventEmitter<boolean>();
  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    // console.log(this.title);
    // console.log('onchange :', this.disable);
  }

  onClickEvent(){
    this.eventTrigger.emit(true);
  }

}
