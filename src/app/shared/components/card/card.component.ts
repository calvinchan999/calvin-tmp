import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  @Input() title: string;
  @Input() icon: string;
  @Input() disable: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    // console.log(this.title);
    // console.log('onchange :', this.disable);
  }

}
