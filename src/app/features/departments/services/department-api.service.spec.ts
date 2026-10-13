import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiResponse } from '../../../shared/models/api-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  CreateDepartmentRequest,
  DeleteDepartmentResult,
  Department,
  UpdateDepartmentRequest,
} from '../models/department.model';
import { DepartmentApiService } from './department-api.service';

describe('DepartmentApiService', () => {
  let service: DepartmentApiService;
  let httpTesting: HttpTestingController;

  const department: Department = {
    id: 4,
    code: 'ENGINEERING',
    name: 'Engineering',
    active: true,
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-12T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DepartmentApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('requests the department list with default pagination', () => {
    const response: ApiResponse<PageResponse<Department>> = {
      status: 200,
      message: 'Departments retrieved successfully',
      data: {
        content: [department],
        page: 1,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      },
    };

    service.getDepartments().subscribe((result) => expect(result).toEqual(response));

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === '/api/departments',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.has('keyword')).toBe(false);

    request.flush(response);
  });

  it('trims the search keyword and sends custom pagination', () => {
    service.getDepartments(2, 10, '  engineer  ').subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === '/api/departments',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('keyword')).toBe('engineer');

    request.flush({
      status: 200,
      message: 'Departments retrieved successfully',
      data: {
        content: [],
        page: 2,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });
  });

  it('requests a department by id', () => {
    const response: ApiResponse<Department> = {
      status: 200,
      message: 'Department retrieved successfully',
      data: department,
    };

    service.getDepartmentById(4).subscribe((result) => expect(result).toEqual(response));

    const request = httpTesting.expectOne('/api/departments/4');

    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('creates a department with code and name', () => {
    const body: CreateDepartmentRequest = {
      code: 'ENGINEERING',
      name: 'Engineering',
    };
    const response: ApiResponse<Department> = {
      status: 201,
      message: 'Department created successfully',
      data: department,
    };

    service.createDepartment(body).subscribe((result) => expect(result).toEqual(response));

    const request = httpTesting.expectOne('/api/departments');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(response);
  });

  it('updates only the department name and active status', () => {
    const body: UpdateDepartmentRequest = {
      name: 'Software Engineering',
      active: false,
    };
    const response: ApiResponse<Department> = {
      status: 200,
      message: 'Department updated successfully',
      data: { ...department, ...body },
    };

    service.updateDepartment(4, body).subscribe((result) => expect(result).toEqual(response));

    const request = httpTesting.expectOne('/api/departments/4');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    expect(request.request.body).not.toHaveProperty('code');
    request.flush(response);
  });

  it('soft deletes a department by id', () => {
    const deleted: DeleteDepartmentResult = {
      id: 4,
      deleted: true,
      deletedAt: '2026-10-13T00:00:00Z',
    };
    const response: ApiResponse<DeleteDepartmentResult> = {
      status: 200,
      message: 'Department deleted successfully',
      data: deleted,
    };

    service.deleteDepartment(4).subscribe((result) => expect(result).toEqual(response));

    const request = httpTesting.expectOne('/api/departments/4');

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(response);
  });
});
