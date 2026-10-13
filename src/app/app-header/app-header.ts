import { DOCUMENT } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

type SupportedLanguage = 'en' | 'th';

@Component({
  selector: 'app-header',
  imports: [TranslatePipe],
  templateUrl: './app-header.html',
})
export class AppHeader {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly appName = input.required<string>();
  protected readonly currentLanguage = this.translate.currentLang;

  constructor() {
    this.translate.addLangs(['en', 'th']);

    const savedLanguage = localStorage.getItem('team-nest-language');
    const initialLanguage: SupportedLanguage = savedLanguage === 'th' ? 'th' : 'en';

    this.setLanguage(initialLanguage);
  }

  protected setLanguage(language: SupportedLanguage): void {
    localStorage.setItem('team-nest-language', language);
    this.document.documentElement.lang = language;
    this.translate.use(language);
  }
}
