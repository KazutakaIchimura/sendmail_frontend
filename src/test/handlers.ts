import { http, HttpResponse } from 'msw';
import {
  adminStaff, roleOptions,
  officeA, officeB,
  userTanaka, userYamada, userTanakaWithOffices,
  mailSendsByOffice, mailSendPending, mailSendSent,
  dashboardData,
} from './fixtures';

const API = '/api';

/**
 * 各テストの共通の前提となるデフォルトのAPIモック。
 * 個別のテストでは server.use(...) で上書きする。
 */
export const handlers = [
  http.get(`${API}/auth/me`, () => HttpResponse.json(adminStaff)),
  http.post(`${API}/auth/login`, () => HttpResponse.json({ message: 'ok' })),
  http.post(`${API}/auth/logout`, () => HttpResponse.json({ message: 'ok' })),
  http.post(`${API}/auth/password/change`, () => HttpResponse.json({ message: 'ok' })),

  http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),

  http.get(`${API}/mail-sends/by-office`, () => HttpResponse.json(mailSendsByOffice)),
  http.get(`${API}/mail-sends`, () => HttpResponse.json([mailSendPending, mailSendSent])),
  http.post(`${API}/mail-sends`, () => HttpResponse.json(mailSendPending)),
  http.post(`${API}/mail-send-batches`, () => HttpResponse.json({ batchId: 9999, sentAt: '2026-06-08T00:00:00Z', updatedCount: 1 })),
  http.get(`${API}/mail-sends/export`, () => new HttpResponse(new Blob(['id,user\n']), { headers: { 'Content-Type': 'text/csv' } })),

  http.get(`${API}/users`, () => HttpResponse.json([userTanaka, userYamada])),
  http.get(`${API}/users/:id`, () => HttpResponse.json(userTanakaWithOffices)),
  http.post(`${API}/users`, () => HttpResponse.json(userTanaka)),
  http.put(`${API}/users/:id`, () => HttpResponse.json(userTanaka)),
  http.get(`${API}/users/:id/offices`, () => HttpResponse.json([officeA, officeB])),
  http.post(`${API}/users/:id/offices`, () => HttpResponse.json({})),
  http.delete(`${API}/users/:userId/offices/:officeId`, () => HttpResponse.json({})),
  http.delete(`${API}/users/:id`, () => HttpResponse.json({})),
  http.patch(`${API}/users/:id/activate`, () => HttpResponse.json({})),

  http.get(`${API}/offices`, () => HttpResponse.json([officeA, officeB])),
  http.get(`${API}/offices/:id`, () => HttpResponse.json(officeA)),
  http.post(`${API}/offices`, () => HttpResponse.json(officeA)),
  http.put(`${API}/offices/:id`, () => HttpResponse.json(officeA)),
  http.delete(`${API}/offices/:id`, () => HttpResponse.json({})),
  http.patch(`${API}/offices/:id/activate`, () => HttpResponse.json({})),

  http.get(`${API}/staffs`, () => HttpResponse.json([adminStaff])),
  http.get(`${API}/roles`, () => HttpResponse.json(roleOptions)),
  http.post(`${API}/staffs`, () => HttpResponse.json(adminStaff)),
  http.put(`${API}/staffs/:id`, () => HttpResponse.json(adminStaff)),
  http.delete(`${API}/staffs/:id`, () => HttpResponse.json({})),
  http.patch(`${API}/staffs/:id/activate`, () => HttpResponse.json(adminStaff)),
];
