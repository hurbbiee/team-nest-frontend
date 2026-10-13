import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { toast } from '@spartan-ng/brain/sonner';
import { ApiErrorResponse } from '../../../../shared/models/api-response.model';
import { UpdateDepartmentRequest } from '../../models/department.model';
import { DepartmentApiService } from '../../services/department-api.service';

@Component({
  selector: 'app-department-update-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './department-update-form.html',
})
export class DepartmentUpdateForm implements OnInit {
  private readonly departmentApi = inject(DepartmentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly departmentId = input.required<number>();
  readonly updated = output<void>();
  readonly cancelled = output<void>();

  protected readonly departmentCode = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly submitErrorMessage = signal<string | null>(null);

  protected readonly departmentForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(/^\S(?:.*\S)?$/),
      ],
    }),
    active: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadDepartment();
  }

  protected loadDepartment(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    this.departmentApi
      .getDepartmentById(this.departmentId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ data: department }) => {
          this.departmentCode.set(department.code);
          this.departmentForm.setValue({
            name: department.name,
            active: department.active,
          });
        },
        error: (error: unknown) => {
          const message = this.resolveErrorMessage(
            error,
            this.translateText('departments.update.loadFallbackError'),
          );

          this.loadErrorMessage.set(message);
          toast.error(message);
        },
      });
  }

  protected submit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const request: UpdateDepartmentRequest = this.departmentForm.getRawValue();

    this.isSubmitting.set(true);
    this.submitErrorMessage.set(null);
    this.departmentForm.disable();

    this.departmentApi
      .updateDepartment(this.departmentId(), request)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.departmentForm.enable();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          toast.success(this.translateText('departments.update.success'));
          this.updated.emit();
        },
        error: (error: unknown) => {
          const message = this.resolveErrorMessage(
            error,
            this.translateText('departments.update.submitFallbackError'),
          );

          this.submitErrorMessage.set(message);
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
