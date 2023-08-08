import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MapWrapperComponent } from '../../utils/map-wrapper/map-wrapper.component';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  @ViewChild('viewComponentRef', { read: ViewContainerRef })
  viewComponentRef: ViewContainerRef;
  @Input() metaData;
  @Output() onClose = new EventEmitter(false);
  confirmButtonName: string;
  message;
  buttonWidth: string;
  buttonHeight: string;
  fontSize: string;
  parentComponent: string;

  constructor(
    private _translateService: TranslateService,
    private sanitizer: DomSanitizer,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    setTimeout(() => {
      const {
        message,
        submitButtonName,
        width,
        height,
        fontSize,
        component,
        editor,
        floorPlanImg,
        rosMapImage,
        metaData
      } = this.metaData;
      this.parentComponent = component;
      this.buttonWidth = width;
      this.buttonHeight = height;
      this.fontSize = fontSize;
      this.message = this.sanitizer.bypassSecurityTrustHtml(
        this._translateService.instant(message)
      );
      if (submitButtonName) {
        this.confirmButtonName = submitButtonName;
      }

      if (editor) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
          MapWrapperComponent
        );
        const componentRef = this.viewComponentRef.createComponent(
          componentFactory
        );
        componentRef.instance.editor = editor;
        componentRef.instance.floorPlan = floorPlanImg;
        componentRef.instance.mapImage = rosMapImage;
        componentRef.instance.metaData = metaData;
        componentRef.instance.disableEditorButton = true;
        componentRef.location.nativeElement.style.width = '100%';
        componentRef.location.nativeElement.style.height = '50vh';
      }
    }, 1000);
  }

  onConfirm() {
    this.onClose.emit({ status: true, parentComponent: this.parentComponent });
  }

  onCancel() {
    this.onClose.emit({ status: false, parentComponent: this.parentComponent });
  }
}
