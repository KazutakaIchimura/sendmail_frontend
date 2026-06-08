import { client } from './client';
import type { Office } from '@/types/office';

export const getOffices = () =>
  client.get<Office[]>('/offices').then(r => r.data);

export const getAllOffices = () =>
  client.get<Office[]>('/offices', { params: { includeInactive: true } }).then(r => r.data);

export const getOffice = (id: number) =>
  client.get<Office>(`/offices/${id}`).then(r => r.data);

export const createOffice = (data: Omit<Office, 'id' | 'isActive'>) =>
  client.post<Office>('/offices', data).then(r => r.data);

/**
 * 事業所情報を更新する
 */
export const updateOffice = ({ id, data }: { id: number; data: Partial<Office> }) =>
  client.put<Office>(`/offices/${id}`, data).then(r => r.data);

export const deleteOffice = (id: number) =>
  client.delete(`/offices/${id}`).then(r => r.data);

export const activateOffice = (id: number) =>
  client.patch(`/offices/${id}/activate`).then(r => r.data);
