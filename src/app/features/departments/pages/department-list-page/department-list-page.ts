import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { TablePagination } from '../../../../shared/components/table-pagination/table-pagination';
import { ApiErrorResponse } from '../../../../shared/models/api-response.model';
import { DepartmentCreateForm } from '../../components/department-create-form/department-create-form';
import { DepartmentUpdateForm } from '../../components/department-update-form/department-update-form';
import { Department } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';

@Component({
  selector: 'app-department-list-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    HlmAlertDialogImports,
    HlmDialogImports,
    TablePagination,
    DepartmentCreateForm,
    DepartmentUpdateForm,
  ],
  templateUrl: './department-list-page.html',
})
export class DepartmentListPage implements OnInit {
  private readonly departmentApi = inject(DepartmentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private departmentRequest?: Subscription;

  protected readonly departments = signal<Department[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly deletingDepartmentId = signal<number | null>(null);
  protected readonly deleteErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDepartments();

    this.searchControl.valueChanges
      .pipe(
        map((keyword) => keyword.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadDepartments();
      });
  }

  protected loadDepartments(): void {
    this.departmentRequest?.unsubscribe();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.departmentRequest = this.departmentApi
      .getDepartments(this.currentPage(), this.pageSize(), this.searchControl.value)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const page = response.data;

          this.departments.set(page.content);
          this.currentPage.set(page.page);
          this.pageSize.set(page.size);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.resolveErrorMessage(
              error,
              this.translateText('departments.list.fallbackError'),
            ),
          );
        },
      });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadDepartments();
  }

  protected prepareDelete(): void {
    this.deleteErrorMessage.set(null);
  }

  protected deleteDepartment(departmentId: number, closeDialog: () => void): void {
    if (this.deletingDepartmentId() !== null) {
      return;
    }

    this.deletingDepartmentId.set(departmentId);
    this.deleteErrorMessage.set(null);

    this.departmentApi
      .deleteDepartment(departmentId)
      .pipe(
        finalize(() => this.deletingDepartmentId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (this.departments().length === 1 && this.currentPage() > 1) {
            this.currentPage.update((page) => page - 1);
          }

          toast.success(this.translateText('departments.delete.success'));
          closeDialog();
          this.loadDepartments();
        },
        error: (error: unknown) => {
          const message = this.resolveErrorMessage(
            error,
            this.translateText('departments.delete.fallbackError'),
          );

          this.deleteErrorMessage.set(message);
          toast.error(message);
        },
      });
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiErrorResponse> | null;

      if (typeof apiError?.message === 'string') {
        return apiError.message;
      }
    }

    return fallbackMessage;
  }

  private translateText(key: string): string {
    const translation = this.translate.instant(key);

    return typeof translation === 'string' ? translation : key;
  }
}
