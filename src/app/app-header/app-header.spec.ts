import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { AppHeader } from './app-header';

describe('AppHeader', () => {
  let fixture: ComponentFixture<AppHeader>;
  let translate: TranslateService;

  const englishTranslations = {
    header: {
      phase: 'Phase 1',
      languageSwitcher: 'Select language',
      english: 'English',
      thai: 'Thai',
    },
  };

  const thaiTranslations = {
    header: {
      phase: 'ระยะที่ 1',
      languageSwitcher: 'เลือกภาษา',
      english: 'ภาษาอังกฤษ',
      thai: 'ภาษาไทย',
    },
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', englishTranslations);
    translate.setTranslation('th', thaiTranslations);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('uses English by default', () => {
    createHeader();

    expect(headerText()).toContain('Team Nest');
    expect(headerText()).toContain('Phase 1');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('team-nest-language')).toBe('en');
    expect(languageButton('EN').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches to Thai and remembers the selected language', () => {
    createHeader();

    languageButton('TH').click();
    fixture.detectChanges();

    expect(headerText()).toContain('ระยะที่ 1');
    expect(document.documentElement.lang).toBe('th');
    expect(localStorage.getItem('team-nest-language')).toBe('th');
    expect(languageButton('TH').getAttribute('aria-pressed')).toBe('true');
    expect(languageButton('EN').getAttribute('aria-pressed')).toBe('false');
  });

  it('restores Thai from local storage when the header is created', () => {
    localStorage.setItem('team-nest-language', 'th');

    createHeader();

    expect(headerText()).toContain('ระยะที่ 1');
    expect(document.documentElement.lang).toBe('th');
    expect(languageButton('TH').getAttribute('aria-pressed')).toBe('true');
  });

  function createHeader(): void {
    fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('appName', 'Team Nest');
    fixture.detectChanges();
  }

  function languageButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );
    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    if (!button) {
      throw new Error(`Language button "${label}" was not found.`);
    }

    return button;
  }

  function headerText(): string {
    return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
  }
});
