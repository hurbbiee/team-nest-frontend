import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { of, throwError } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Department } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';
import { DepartmentUpdateForm } from './department-update-form';

describe('DepartmentUpdateForm', () => {
  let fixture: ComponentFixture<DepartmentUpdateForm>;
  let translate: TranslateService;
  let apiMock: {
    getDepartmentById: ReturnType<typeof vi.fn>;
    updateDepartment: ReturnType<typeof vi.fn>;
  };

  const department: Department = {
    id: 4,
    code: 'ENGINEERING',
    name: 'Engineering',
    active: true,
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-12T00:00:00Z',
  };

  const getResponse: ApiResponse<Department> = {
    status: 200,
    message: 'Department retrieved successfully',
    data: department,
  };

  beforeEach(async () => {
    apiMock = {
      getDepartmentById: vi.fn(),
      updateDepartment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DepartmentUpdateForm],
      providers: [
        { provide: DepartmentApiService, useValue: apiMock },
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      departments: {
        update: {
          loading: 'Loading department...',
          codeLabel: 'Department code',
          codeHelp: 'Department code cannot be changed.',
          nameLabel: 'Department name',
          nameRequired: 'Department name is required.',
          nameMaxLength: 'Department name must not exceed 150 characters.',
          namePattern: 'Department name must not have spaces at the beginning or end.',
          activeLabel: 'Active department',
          activeHelp: 'Inactive departments remain saved but are marked unavailable.',
          cancel: 'Cancel',
          retry: 'Try again',
          submit: 'Save changes',
          submitting: 'Saving...',
          success: 'Department updated successfully.',
          loadFallbackError: 'Unable to load the department. Please try again.',
          submitFallbackError: 'Unable to update the department. Please try again.',
        },
      },
    });
    translate.setTranslation('th', {
      departments: {
        update: {
          loading: 'กำลังโหลดข้อมูลแผนก...',
          codeLabel: 'รหัสแผนก',
          codeHelp: 'ไม่สามารถแก้ไขรหัสแผนกได้',
          nameLabel: 'ชื่อแผนก',
          nameRequired: 'กรุณากรอกชื่อแผนก',
          nameMaxLength: 'ชื่อแผนกต้องยาวไม่เกิน 150 ตัวอักษร',
          namePattern: 'ชื่อแผนกต้องไม่มีช่องว่างด้านหน้าหรือด้านหลัง',
          activeLabel: 'เปิดใช้งานแผนก',
          activeHelp: 'แผนกที่ปิดใช้งานจะยังถูกบันทึกไว้ แต่จะแสดงว่าไม่พร้อมใช้งาน',
          cancel: 'ยกเลิก',
          retry: 'ลองอีกครั้ง',
          submit: 'บันทึกการแก้ไข',
          submitting: 'กำลังบันทึก...',
          success: 'แก้ไขแผนกสำเร็จ',
          loadFallbackError: 'ไม่สามารถโหลดข้อมูลแผนกได้ กรุณาลองอีกครั้ง',
          submitFallbackError: 'ไม่สามารถแก้ไขแผนกได้ กรุณาลองอีกครั้ง',
        },
      },
    });

    fixture = TestBed.createComponent(DepartmentUpdateForm);
    fixture.componentRef.setInput('departmentId', 4);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the department by id and fills the form', () => {
    initializeWithDepartment();

    const codeInput = queryInput('#department-update-code');
    const nameInput = queryInput('#department-update-name');
    const activeInput = queryInput('input[type="checkbox"]');

    expect(apiMock.getDepartmentById).toHaveBeenCalledWith(4);
    expect(codeInput.value).toBe('ENGINEERING');
    expect(codeInput.readOnly).toBe(true);
    expect(nameInput.value).toBe('Engineering');
    expect(activeInput.checked).toBe(true);
  });

  it('updates only the name and active status', () => {
    const response: ApiResponse<Department> = {
      status: 200,
      message: 'Department updated successfully',
      data: {
        ...department,
        name: 'Software Engineering',
        active: false,
      },
    };
    const successToast = vi.spyOn(toast, 'success');
    const updated = vi.fn();

    apiMock.updateDepartment.mockReturnValue(of(response));
    initializeWithDepartment();
    fixture.componentInstance.updated.subscribe(updated);

    setInputValue('#department-update-name', 'Software Engineering');
    setCheckboxValue(false);
    submitForm();

    expect(apiMock.updateDepartment).toHaveBeenCalledWith(4, {
      name: 'Software Engineering',
      active: false,
    });
    expect(apiMock.updateDepartment.mock.calls[0][1]).not.toHaveProperty('code');
    expect(successToast).toHaveBeenCalledWith('Department updated successfully.');
    expect(updated).toHaveBeenCalledOnce();
  });

  it('uses the active Thai translations in the form and success toast', () => {
    const successToast = vi.spyOn(toast, 'success');

    translate.use('th');
    apiMock.updateDepartment.mockReturnValue(of(getResponse));
    initializeWithDepartment();

    expect(fixture.nativeElement.textContent).toContain('ชื่อแผนก');

    setInputValue('#department-update-name', 'วิศวกรรมซอฟต์แวร์');
    submitForm();

    expect(successToast).toHaveBeenCalledWith('แก้ไขแผนกสำเร็จ');
  });

  it('does not call the update API when the name is invalid', () => {
    initializeWithDepartment();
    setInputValue('#department-update-name', ' Engineering ');

    submitForm();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Department name must not have spaces at the beginning or end.',
    );
    expect(apiMock.updateDepartment).not.toHaveBeenCalled();
  });

  it('shows the load error and an error toast when loading fails', () => {
    const errorToast = vi.spyOn(toast, 'error');
    const error = createApiError(404, 'Department not found');

    apiMock.getDepartmentById.mockReturnValue(throwError(() => error));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Department not found');
    expect(errorToast).toHaveBeenCalledWith('Department not found');
    expect(apiMock.updateDepartment).not.toHaveBeenCalled();
  });

  it('shows the backend error and does not emit updated when saving fails', () => {
    const errorToast = vi.spyOn(toast, 'error');
    const updated = vi.fn();
    const error = createApiError(400, 'Request validation failed');

    apiMock.updateDepartment.mockReturnValue(throwError(() => error));
    initializeWithDepartment();
    fixture.componentInstance.updated.subscribe(updated);

    setInputValue('#department-update-name', 'Software Engineering');
    submitForm();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Request validation failed');
    expect(errorToast).toHaveBeenCalledWith('Request validation failed');
    expect(updated).not.toHaveBeenCalled();
  });

  function initializeWithDepartment(): void {
    apiMock.getDepartmentById.mockReturnValue(of(getResponse));
    fixture.detectChanges();
  }

  function queryInput(selector: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  }

  function setInputValue(selector: string, value: string): void {
    const input = queryInput(selector);

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setCheckboxValue(checked: boolean): void {
    const checkbox = queryInput('input[type="checkbox"]');

    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));
  }

  function createApiError(status: number, message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      error: { status, message },
    });
  }
});
