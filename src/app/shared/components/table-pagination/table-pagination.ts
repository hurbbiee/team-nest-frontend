import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-table-pagination',
  imports: [TranslatePipe],
  templateUrl: './table-pagination.html',
})
export class TablePagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly visibleElements = input.required<number>();
  readonly itemLabel = input('items');

  readonly pageChange = output<number>();

  protected readonly canGoPrevious = computed(() => this.currentPage() > 1);
  protected readonly canGoNext = computed(
    () => this.totalPages() > 0 && this.currentPage() < this.totalPages(),
  );

  protected goToPreviousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.pageChange.emit(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.pageChange.emit(this.currentPage() + 1);
  }
}
