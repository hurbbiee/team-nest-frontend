export interface Department {
  id: number;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
}

export interface UpdateDepartmentRequest {
  name: string;
  active: boolean;
}

export interface DeleteDepartmentResult {
  id: number;
  deleted: boolean;
  deletedAt: string;
}
