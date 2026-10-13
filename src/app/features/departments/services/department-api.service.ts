import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../shared/models/api-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  CreateDepartmentRequest,
  DeleteDepartmentResult,
  Department,
  UpdateDepartmentRequest,
} from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/departments';

  getDepartments(page = 1, size = 20, keyword?: string): Observable<ApiResponse<PageResponse<Department>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) {
      params = params.set('keyword', normalizedKeyword);
    }

    return this.http.get<ApiResponse<PageResponse<Department>>>(this.baseUrl, { params });
  }

  getDepartmentById(id: number): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.baseUrl}/${id}`);
  }

  createDepartment(request: CreateDepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(this.baseUrl, request);
  }

  updateDepartment(id: number, request: UpdateDepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.baseUrl}/${id}`, request);
  }

  deleteDepartment(id: number): Observable<ApiResponse<DeleteDepartmentResult>> {
    return this.http.delete<ApiResponse<DeleteDepartmentResult>>(`${this.baseUrl}/${id}`);
  }
}
