import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { toast } from '@spartan-ng/brain/sonner';
import { ApiErrorResponse } from '../../../../shared/models/api-response.model';
import { CreateDepartmentRequest } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';

@Component({
  selector: 'app-department-create-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './department-create-form.html',
})
export class DepartmentCreateForm {
  private readonly departmentApi = inject(DepartmentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly created = output<void>();
  readonly cancelled = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly departmentForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[A-Z][A-Z0-9_-]*$/),
      ],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(/^\S(?:.*\S)?$/),
      ],
    }),
  });

  protected normalizeCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalizedCode = input.value.toUpperCase();

    input.value = normalizedCode;
    this.departmentForm.controls.code.setValue(normalizedCode);
  }

  protected submit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const request: CreateDepartmentRequest = this.departmentForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.departmentForm.disable();

    this.departmentApi
      .createDepartment(request)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.departmentForm.enable();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          toast.success(this.translateText('departments.create.success'));
          this.created.emit();
        },
        error: (error: unknown) => {
          const message = this.resolveErrorMessage(error);

          this.errorMessage.set(message);
          toast.error(message);
        },
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiErrorResponse> | null;

      if (typeof apiError?.message === 'string') {
        return apiError.message;
      }
    }

    return this.translateText('departments.create.fallbackError');
  }

  private translateText(key: string): string {
    const value = this.translate.instant(key);

    return typeof value === 'string' ? value : key;
  }
}
