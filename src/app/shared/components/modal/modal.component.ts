import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnDestroy {
  @ContentChild('modalHeader') header: TemplateRef<any>;
  @ContentChild('modalBody') body: TemplateRef<any>;
  @ContentChild('modalFooter') footer: TemplateRef<any>;
  @ContentChild('modalResponse') response: TemplateRef<any>;
  @Input() closeOnOutsideClick = true;
  @Input() disableClose = false;
  @Input() closeAfterRefresh = false;
  public closeTrigger$ = new Subject<any>();

  visible = false;
  visibleAnimate = false;

  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {
    this.closeTrigger$.subscribe(() => {
      this.close();
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.close();
  }

  open(): void {
    document.body.classList.add('modal-wrapper');
    this.visible = true;
    setTimeout(() => {
      this.visibleAnimate = true;
    });
  }

  close(): void {
    document.body.classList.remove('modal-wrapper');
    this.visibleAnimate = false;
    setTimeout(() => {
      this.visible = false;
      this.changeDetectorRef.markForCheck();
      this.router.navigate(['']);
    }, 200);
  }

  onCloseWithoutRefresh(): void {
    document.body.classList.remove('modal-wrapper');
    this.visibleAnimate = false;
    this.visible = false;
  }

  isExist(): boolean {
    return !!this.elementRef.nativeElement.querySelector('.modal');
  }
}
