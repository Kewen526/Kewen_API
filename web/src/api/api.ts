import request from '../utils/request';

export interface Api {
  id: string;
  name: string;
  path: string;
  method: string;
  version: string;
  dataSourceId: string;
  sql: string;
  status: string;
  cacheEnabled: boolean;
  cacheTtl?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiParams {
  name: string;
  path: string;
  method: string;
  dataSourceId: string;
  sql: string;
  version?: string;
  parameters?: any;
  responseMapping?: any;
  cacheEnabled?: boolean;
  cacheTtl?: number;
  rateLimitEnabled?: boolean;
  rateLimit?: number;
  ipWhitelist?: string[];
  requireAuth?: boolean;
  description?: string;
  tags?: string[];
}

export const apiApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; status?: string; method?: string }) =>
    request.get('/apis', { params }),

  get: (id: string) => request.get(`/apis/${id}`),

  create: (data: CreateApiParams) => request.post('/apis', data),

  update: (id: string, data: Partial<CreateApiParams>) =>
    request.put(`/apis/${id}`, data),

  delete: (id: string) => request.delete(`/apis/${id}`),

  publish: (id: string) => request.post(`/apis/${id}/publish`),

  unpublish: (id: string) => request.post(`/apis/${id}/unpublish`),

  getMetrics: (id: string, days?: number) =>
    request.get(`/apis/${id}/metrics`, { params: { days } }),

  getLogs: (id: string, params?: { page?: number; pageSize?: number; status?: string }) =>
    request.get(`/apis/${id}/logs`, { params }),
};
