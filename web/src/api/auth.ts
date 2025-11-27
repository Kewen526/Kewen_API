import request from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  login: (data: LoginParams) => request.post('/auth/login', data),

  register: (data: RegisterParams) => request.post('/auth/register', data),

  me: () => request.get('/auth/me'),
};
