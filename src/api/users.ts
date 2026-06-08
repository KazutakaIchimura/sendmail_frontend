import { client } from './client';
import type { User, UserWithOffices } from '@/types/user';
import type { Office } from '@/types/office';

export const getUsers = () =>
  client.get<User[]>('/users').then(r => r.data);

export const getAllUsers = () =>
  client.get<User[]>('/users', { params: { includeInactive: true } }).then(r => r.data);

export const getUser = (id: number) =>
  client.get<UserWithOffices>(`/users/${id}`).then(r => r.data);

export const createUser = (data: Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) =>
  client.post<User>('/users', data).then(r => r.data);

/**
 * 利用者情報を更新する
 */
export const updateUser = ({ id, data }: { id: number; data: Partial<User> }) =>
  client.put<User>(`/users/${id}`, data).then(r => r.data);

export const getUserOffices = (userId: number) =>
  client.get<Office[]>(`/users/${userId}/offices`).then(r => r.data);

/**
 * 利用者に事業所を紐付ける
 */
export const addUserOffice = ({ userId, officeId }: { userId: number; officeId: number }) =>
  client.post(`/users/${userId}/offices`, { officeId }).then(r => r.data);

/**
 * 利用者から事業所の紐付けを解除する
 */
export const removeUserOffice = ({ userId, officeId }: { userId: number; officeId: number }) =>
  client.delete(`/users/${userId}/offices/${officeId}`).then(r => r.data);

/**
 * 利用者を無効化する
 */
export const deleteUser = (id: number) =>
  client.delete(`/users/${id}`).then(r => r.data);

export const activateUser = (id: number) =>
  client.patch(`/users/${id}/activate`).then(r => r.data);
