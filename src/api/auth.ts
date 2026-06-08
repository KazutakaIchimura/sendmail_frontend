import { client } from './client';
import type { Staff } from '@/types/staff';

export const login = (data: { email: string; password: string }) => {
  const params = new URLSearchParams();
  params.append('username', data.email);
  params.append('password', data.password);
  return client.post<{ message: string }>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.data);
};

export const logout = () =>
  client.post('/auth/logout').then(r => r.data);

export const getMe = () =>
  client.get<Staff>('/auth/me').then(r => r.data);

export const changePassword = (data: {
  newPassword: string;
}) => client.post('/auth/password/change', data).then(r => r.data);
