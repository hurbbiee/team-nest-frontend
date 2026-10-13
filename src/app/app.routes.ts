import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'departments',
    loadComponent: () =>
      import('./features/departments/pages/department-list-page/department-list-page').then(
        (module) => module.DepartmentListPage,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'departments',
  },
];
