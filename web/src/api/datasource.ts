import request from '../utils/request';

export interface DataSource {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataSourceParams {
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  description?: string;
}

export const dataSourceApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get('/datasources', { params }),

  get: (id: string) => request.get(`/datasources/${id}`),

  create: (data: CreateDataSourceParams) => request.post('/datasources', data),

  update: (id: string, data: Partial<CreateDataSourceParams>) =>
    request.put(`/datasources/${id}`, data),

  delete: (id: string) => request.delete(`/datasources/${id}`),

  test: (id: string) => request.post(`/datasources/${id}/test`),

  getTables: (id: string) => request.get(`/datasources/${id}/tables`),

  getTableSchema: (id: string, tableName: string) =>
    request.get(`/datasources/${id}/tables/${tableName}/schema`),

  executeQuery: (id: string, sql: string, parameters?: any[]) =>
    request.post(`/datasources/${id}/query`, { sql, parameters }),
};
