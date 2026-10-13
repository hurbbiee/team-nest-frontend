import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TablePagination } from './table-pagination';

describe('TablePagination', () => {
  let fixture: ComponentFixture<TablePagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePagination],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      shared: {
        pagination: {
          label: 'Pagination',
          showing: 'Showing {{visible}} of {{total}} {{item}}',
          previous: 'Previous',
          next: 'Next',
          page: 'Page {{current}} of {{total}}',
        },
      },
    });

    fixture = TestBed.createComponent(TablePagination);
  });

  it('shows the current page and item totals', () => {
    setInputs({
      currentPage: 2,
      totalPages: 4,
      totalElements: 67,
      visibleElements: 20,
      itemLabel: 'departments',
    });

    const content = normalizedText();

    expect(content).toContain('Showing 20 of 67 departments');
    expect(content).toContain('Page 2 of 4');
  });

  it('disables Previous on the first page', () => {
    const pageChange = vi.fn();

    setInputs({ currentPage: 1, totalPages: 3, totalElements: 50, visibleElements: 20 });
    fixture.componentInstance.pageChange.subscribe(pageChange);

    const [previousButton, nextButton] = buttons();

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);

    previousButton.click();
    expect(pageChange).not.toHaveBeenCalled();
  });

  it('disables Next on the last page', () => {
    const pageChange = vi.fn();

    setInputs({ currentPage: 3, totalPages: 3, totalElements: 50, visibleElements: 10 });
    fixture.componentInstance.pageChange.subscribe(pageChange);

    const [previousButton, nextButton] = buttons();

    expect(previousButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(true);

    nextButton.click();
    expect(pageChange).not.toHaveBeenCalled();
  });

  it('emits the previous and next page numbers', () => {
    const pageChange = vi.fn();

    setInputs({ currentPage: 2, totalPages: 3, totalElements: 50, visibleElements: 20 });
    fixture.componentInstance.pageChange.subscribe(pageChange);

    const [previousButton, nextButton] = buttons();

    previousButton.click();
    nextButton.click();

    expect(pageChange).toHaveBeenNthCalledWith(1, 1);
    expect(pageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('shows page 1 of 1 and disables navigation when there are no items', () => {
    setInputs({ currentPage: 1, totalPages: 0, totalElements: 0, visibleElements: 0 });

    const [previousButton, nextButton] = buttons();

    expect(normalizedText()).toContain('Showing 0 of 0 items');
    expect(normalizedText()).toContain('Page 1 of 1');
    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);
  });

  function setInputs(values: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    visibleElements: number;
    itemLabel?: string;
  }): void {
    fixture.componentRef.setInput('currentPage', values.currentPage);
    fixture.componentRef.setInput('totalPages', values.totalPages);
    fixture.componentRef.setInput('totalElements', values.totalElements);
    fixture.componentRef.setInput('visibleElements', values.visibleElements);

    if (values.itemLabel !== undefined) {
      fixture.componentRef.setInput('itemLabel', values.itemLabel);
    }

    fixture.detectChanges();
  }

  function buttons(): [HTMLButtonElement, HTMLButtonElement] {
    const elements = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    return [elements[0], elements[1]];
  }

  function normalizedText(): string {
    return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
  }
});
