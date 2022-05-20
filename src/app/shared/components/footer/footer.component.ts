import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { iif, of, Subscription } from 'rxjs';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  currentUrl: string = '';
  sub = new Subscription();
  map: any = this.sharedService.currentMap$.pipe(
    mergeMap((value: any) =>
      iif(() => !!value, of(value), this.translateService.get('mapNotFound'))
    )
  );

  constructor(
    private sharedService: SharedService,
    private translateService: TranslateService,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // event is an instance of NavigationEnd, get url!
        this.currentUrl = event.urlAfterRedirects;
        console.log(this.currentUrl);
      }
    });
  }

  ngOnInit() {

  }
}
