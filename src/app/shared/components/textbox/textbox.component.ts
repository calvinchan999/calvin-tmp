import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-textbox',
  templateUrl: './textbox.component.html',
  styleUrls: ['./textbox.component.scss'],
})
export class TextboxComponent implements OnInit {
  @Input() name: string;
  @Input() type: string;
  @Output() childEvents = new EventEmitter<string>();
  inputType: string;
  constructor() {}

  ngOnInit(): void {
    if (this.type === 'password') {
      this.inputType = 'password';
    } else {
      this.inputType = 'text';
    }
  }

  onChangeValue(event: any) {
    console.log(event.target.value);
    this.childEvents.emit(event.target.value);
  }
}
