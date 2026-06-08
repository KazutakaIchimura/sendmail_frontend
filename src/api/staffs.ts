import { client } from './client';
import type { Staff, RoleOption } from '@/types/staff';

export const getStaffs = (params?: { includeInactive?: boolean }) =>
  client.get<Staff[]>('/staffs', { params }).then(r => r.data);

export const getRoles = () =>
  client.get<RoleOption[]>('/roles').then(r => r.data);

export const createStaff = (data: Omit<Staff, 'id' | 'isActive' | 'forcePasswordChange' | 'createdAt' | 'roleId'> & { password?: string }) =>
  client.post<Staff>('/staffs', data).then(r => r.data);

/**
 * スタッフ情報を更新する
 */
export const updateStaff = ({ id, data }: { id: number; data: Partial<Staff> }) =>
  client.put<Staff>(`/staffs/${id}`, data).then(r => r.data);

export const disableStaff = (id: number) =>
  client.delete(`/staffs/${id}`).then(r => r.data);

export const activateStaff = (id: number) =>
  client.patch<Staff>(`/staffs/${id}/activate`).then(r => r.data);
