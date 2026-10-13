import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { of, throwError } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Department } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';
import { DepartmentCreateForm } from './department-create-form';

describe('DepartmentCreateForm', () => {
  let fixture: ComponentFixture<DepartmentCreateForm>;
  let apiMock: {
    createDepartment: ReturnType<typeof vi.fn>;
  };

  const createdDepartment: Department = {
    id: 4,
    code: 'DEVELOPER',
    name: 'Developer Experience',
    active: true,
    createdAt: '2026-10-13T00:00:00Z',
    updatedAt: '2026-10-13T00:00:00Z',
  };

  beforeEach(async () => {
    apiMock = {
      createDepartment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DepartmentCreateForm],
      providers: [
        { provide: DepartmentApiService, useValue: apiMock },
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      departments: {
        create: {
          codeLabel: 'Department code',
          codeHelp: 'Start with A–Z. Use only uppercase letters, numbers, underscore, or hyphen.',
          codeRequired: 'Department code is required.',
          codeMaxLength: 'Department code must not exceed 50 characters.',
          codePattern:
            'Department code must start with an uppercase letter and use only A–Z, 0–9, _ or -.',
          nameLabel: 'Department name',
          nameRequired: 'Department name is required.',
          nameMaxLength: 'Department name must not exceed 150 characters.',
          namePattern: 'Department name must not have spaces at the beginning or end.',
          cancel: 'Cancel',
          submit: 'Create department',
          submitting: 'Creating...',
          success: 'Department created successfully.',
          fallbackError: 'Unable to create the department. Please try again.',
        },
      },
    });

    fixture = TestBed.createComponent(DepartmentCreateForm);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows required validation and does not call the API for an empty form', () => {
    submitForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Department code is required.');
    expect(content).toContain('Department name is required.');
    expect(apiMock.createDepartment).not.toHaveBeenCalled();
  });

  it('normalizes the code to uppercase and sends the expected request', () => {
    const response: ApiResponse<Department> = {
      status: 201,
      message: 'Department created successfully',
      data: createdDepartment,
    };
    const successToast = vi.spyOn(toast, 'success');
    const created = vi.fn();

    apiMock.createDepartment.mockReturnValue(of(response));
    fixture.componentInstance.created.subscribe(created);

    const codeInput = setInputValue('#department-code', 'developer');
    setInputValue('#department-name', 'Developer Experience');

    expect(codeInput.value).toBe('DEVELOPER');

    submitForm();

    expect(apiMock.createDepartment).toHaveBeenCalledWith({
      code: 'DEVELOPER',
      name: 'Developer Experience',
    });
    expect(successToast).toHaveBeenCalledWith('Department created successfully.');
    expect(created).toHaveBeenCalledOnce();
  });

  it('rejects an invalid code and surrounding spaces in the name', () => {
    setInputValue('#department-code', 'DEVELOPER!');
    setInputValue('#department-name', ' Developer Experience ');

    submitForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Department code must start with an uppercase letter and use only A–Z, 0–9, _ or -.',
    );
    expect(content).toContain('Department name must not have spaces at the beginning or end.');
    expect(apiMock.createDepartment).not.toHaveBeenCalled();
  });

  it('shows the backend error and an error toast when creation fails', () => {
    const errorToast = vi.spyOn(toast, 'error');
    const created = vi.fn();
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        status: 409,
        message: 'Department code already exists',
      },
    });

    apiMock.createDepartment.mockReturnValue(throwError(() => error));
    fixture.componentInstance.created.subscribe(created);

    setInputValue('#department-code', 'DEVELOPER');
    setInputValue('#department-name', 'Developer Experience');
    submitForm();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Department code already exists');
    expect(errorToast).toHaveBeenCalledWith('Department code already exists');
    expect(created).not.toHaveBeenCalled();
  });

  function setInputValue(selector: string, value: string): HTMLInputElement {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    return input;
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));
  }
});
