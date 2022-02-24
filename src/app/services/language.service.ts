import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  language$ = new ReplaySubject<LangChangeEvent>(1);
  translate = this.translateService;
  
  constructor(private translateService: TranslateService) {}

  setInitState() {
    this.translateService.addLangs(['en', 'tc']);

    // const browserLang = (this.translate.getBrowserLang().includes('tc')) ? 'tc' : 'en' ;
    // this.setLang(browserLang);
    this.setLang('tc');
  }

  setLang(lang: string) {
    this.translateService.onLangChange.pipe(take(1)).subscribe(result => {
      this.language$.next(result);
    });
    this.translateService.use(lang);
  }
}