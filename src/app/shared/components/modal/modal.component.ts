import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
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
    document.body.classList.add('modal-open');
    this.visible = true;
    setTimeout(() => {
      this.visibleAnimate = true;
    });
  }

  close(): void {
    document.body.classList.remove('modal-open');
    this.visibleAnimate = false;
    setTimeout(() => {
      this.visible = false;
      this.changeDetectorRef.markForCheck();
      // this.router.navigate([currentUrl]).then(() => location.reload());
      this.router.navigate(['']);
    }, 200);
  }

  onCloseWithoutRefresh(): void {
    document.body.classList.remove('modal-open');
    this.visibleAnimate = false;
    this.visible = false;
    // setTimeout(() => {
    //   this.visible = false;
    //   this.changeDetectorRef.markForCheck();
    // }, 200);
  }

  // @HostListener('click', ['$event'])
  // onContainerClicked(event: MouseEvent): void {
  //   if ((<HTMLElement>event.target).classList.contains('modal') && this.isTopMost() && this.closeOnOutsideClick) {
  //     this.close();
  //   }
  // }

  // @HostListener('document:keydown', ['$event'])
  // onKeyDownHandler(event: KeyboardEvent) {
  //   // If ESC key and TOP MOST modal, close it.
  //   if (event.key === 'Escape' && this.isTopMost()) {
  //     this.close();
  //   }
  // }

  /**
   * Returns true if this modal is the top most modal.
   */
  isTopMost(): boolean {
    return !this.elementRef.nativeElement.querySelector(
      ':scope modal > .modal'
    );
  }
}
