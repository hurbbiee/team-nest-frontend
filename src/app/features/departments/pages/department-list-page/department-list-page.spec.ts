import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { Subject, of, throwError } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { DeleteDepartmentResult, Department } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';
import { DepartmentListPage } from './department-list-page';

interface TestableDepartmentListPage {
  deleteDepartment(departmentId: number, closeDialog: () => void): void;
}

describe('DepartmentListPage', () => {
  let fixture: ComponentFixture<DepartmentListPage>;
  let translate: TranslateService;
  let apiMock: {
    getDepartments: ReturnType<typeof vi.fn>;
    deleteDepartment: ReturnType<typeof vi.fn>;
  };

  const department: Department = {
    id: 4,
    code: 'ENGINEERING',
    name: 'Engineering',
    active: true,
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-12T00:00:00Z',
  };

  beforeEach(async () => {
    apiMock = {
      getDepartments: vi.fn(),
      deleteDepartment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DepartmentListPage],
      providers: [
        { provide: DepartmentApiService, useValue: apiMock },
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      departments: {
        common: { items: 'departments' },
        create: {
          title: 'Create department',
          description: 'Add a new department to your organization.',
        },
        update: {
          title: 'Update department',
          description: 'Update the department name and active status.',
        },
        delete: {
          title: 'Delete department?',
          description: 'This department will no longer appear in normal department lists.',
          cancel: 'Cancel',
          submit: 'Delete department',
          submitting: 'Deleting...',
          success: 'Department deleted successfully.',
          fallbackError: 'Unable to delete the department. Please try again.',
        },
        list: {
          eyebrow: 'Organization',
          title: 'Departments',
          description: 'View the departments configured for Team Nest.',
          create: 'Create department',
          searchLabel: 'Search departments',
          searchPlaceholder: 'Search by code or name',
          loading: 'Loading departments...',
          errorTitle: 'Unable to load departments',
          fallbackError: 'Unable to load departments. Please try again.',
          retry: 'Try again',
          noMatchesTitle: 'No matching departments',
          noMatchesDescription: 'Try searching with a different code or name.',
          emptyTitle: 'No departments yet',
          emptyDescription: 'Create a department to start building your organization.',
          columns: {
            id: 'ID',
            code: 'Code',
            name: 'Name',
            status: 'Status',
            actions: 'Actions',
          },
          status: { active: 'Active', inactive: 'Inactive' },
          actions: { edit: 'Edit', delete: 'Delete' },
        },
      },
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
    translate.setTranslation('th', {
      departments: {
        delete: {
          success: 'ลบแผนกสำเร็จ',
          fallbackError: 'ไม่สามารถลบแผนกได้ กรุณาลองอีกครั้ง',
        },
      },
    });

    fixture = TestBed.createComponent(DepartmentListPage);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows loading before the response and then renders departments', () => {
    const response$ = new Subject<ApiResponse<PageResponse<Department>>>();

    apiMock.getDepartments.mockReturnValue(response$);
    fixture.detectChanges();

    expect(pageText()).toContain('Loading departments...');

    response$.next(pageResponse({ content: [department], totalElements: 1, totalPages: 1 }));
    response$.complete();
    fixture.detectChanges();

    expect(apiMock.getDepartments).toHaveBeenCalledWith(1, 20, '');
    expect(pageText()).toContain('ENGINEERING');
    expect(pageText()).toContain('Engineering');
    expect(pageText()).toContain('Showing 1 of 1 departments');
  });

  it('shows the backend message when loading the list fails', () => {
    apiMock.getDepartments.mockReturnValue(
      throwError(() => createApiError(500, 'Department service unavailable')),
    );

    fixture.detectChanges();

    expect(pageText()).toContain('Unable to load departments');
    expect(pageText()).toContain('Department service unavailable');
  });

  it('debounces search and resets to page 1', () => {
    vi.useFakeTimers();
    apiMock.getDepartments.mockReturnValue(
      of(pageResponse({ content: [department], page: 2, totalElements: 21, totalPages: 2 })),
    );
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '#department-search',
    ) as HTMLInputElement;

    searchInput.value = '  engineer  ';
    searchInput.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(299);
    expect(apiMock.getDepartments).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(apiMock.getDepartments).toHaveBeenCalledTimes(2);
    expect(apiMock.getDepartments).toHaveBeenLastCalledWith(1, 20, '  engineer  ');
  });

  it('loads the next page when the pagination component emits a page change', () => {
    apiMock.getDepartments
      .mockReturnValueOnce(
        of(pageResponse({ content: [department], page: 1, totalElements: 21, totalPages: 2 })),
      )
      .mockReturnValueOnce(
        of(pageResponse({ content: [department], page: 2, totalElements: 21, totalPages: 2 })),
      );
    fixture.detectChanges();

    const nextButton = findButton('Next');
    nextButton.click();

    expect(apiMock.getDepartments).toHaveBeenLastCalledWith(2, 20, '');
  });

  it('moves to the previous page after deleting the last item on the current page', () => {
    const closeDialog = vi.fn();
    const successToast = vi.spyOn(toast, 'success');
    const deleteResponse: ApiResponse<DeleteDepartmentResult> = {
      status: 200,
      message: 'Department deleted successfully',
      data: {
        id: 4,
        deleted: true,
        deletedAt: '2026-10-13T00:00:00Z',
      },
    };

    apiMock.getDepartments
      .mockReturnValueOnce(
        of(pageResponse({ content: [department], page: 2, totalElements: 21, totalPages: 2 })),
      )
      .mockReturnValueOnce(
        of(pageResponse({ content: [department], page: 1, totalElements: 20, totalPages: 1 })),
      );
    apiMock.deleteDepartment.mockReturnValue(of(deleteResponse));
    fixture.detectChanges();

    testableComponent().deleteDepartment(4, closeDialog);

    expect(apiMock.deleteDepartment).toHaveBeenCalledWith(4);
    expect(closeDialog).toHaveBeenCalledOnce();
    expect(apiMock.getDepartments).toHaveBeenLastCalledWith(1, 20, '');
    expect(successToast).toHaveBeenCalledWith('Department deleted successfully.');
  });

  it('keeps the confirmation open and shows an error toast when deletion fails', () => {
    const closeDialog = vi.fn();
    const errorToast = vi.spyOn(toast, 'error');

    apiMock.getDepartments.mockReturnValue(
      of(pageResponse({ content: [department], totalElements: 1, totalPages: 1 })),
    );
    apiMock.deleteDepartment.mockReturnValue(
      throwError(() => createApiError(404, 'Department not found')),
    );
    fixture.detectChanges();

    testableComponent().deleteDepartment(4, closeDialog);

    expect(closeDialog).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith('Department not found');
    expect(apiMock.getDepartments).toHaveBeenCalledTimes(1);
  });

  it('uses the active Thai fallback when deletion fails without an API message', () => {
    const closeDialog = vi.fn();
    const errorToast = vi.spyOn(toast, 'error');

    translate.use('th');
    apiMock.getDepartments.mockReturnValue(
      of(pageResponse({ content: [department], totalElements: 1, totalPages: 1 })),
    );
    apiMock.deleteDepartment.mockReturnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();

    testableComponent().deleteDepartment(4, closeDialog);

    expect(closeDialog).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith('ไม่สามารถลบแผนกได้ กรุณาลองอีกครั้ง');
  });

  function pageResponse(
    overrides: Partial<PageResponse<Department>> = {},
  ): ApiResponse<PageResponse<Department>> {
    return {
      status: 200,
      message: 'Departments retrieved successfully',
      data: {
        content: [],
        page: 1,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        ...overrides,
      },
    };
  }

  function createApiError(status: number, message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      error: { status, message },
    });
  }

  function findButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );
    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    if (!button) {
      throw new Error(`Button "${label}" was not found.`);
    }

    return button;
  }

  function pageText(): string {
    return (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
  }

  function testableComponent(): TestableDepartmentListPage {
    return fixture.componentInstance as unknown as TestableDepartmentListPage;
  }
});
