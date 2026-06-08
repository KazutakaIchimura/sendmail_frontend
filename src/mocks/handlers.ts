import { http, HttpResponse } from 'msw';
import {
  mockStaffs, mockOffices, mockUsers, mockUserOffices,
  mockMailSends, mockByOffice, mockDashboard,
} from './data';

let staffs = [...mockStaffs];
let offices = [...mockOffices];
let users = [...mockUsers];
let mailSends = [...mockMailSends];
let nextMailSendId = 20;

export const handlers = [
  // Auth
  http.get('/api/auth/me', () => HttpResponse.json(staffs.find(s => s.id === 1))),
  http.post('/api/auth/logout', () => HttpResponse.json({})),
  http.post('/api/auth/login', async ({ request }) => {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const username = params.get('username') ?? '';
    const staff = staffs.find(s => s.email === username && s.isActive);
    if (!staff) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({ message: 'ログイン成功' });
  }),
  http.post('/api/auth/change-password', () => HttpResponse.json({})),

  // Dashboard
  http.get('/api/dashboard', () => HttpResponse.json(mockDashboard)),

  // Mail sends
  http.get('/api/mail-sends/by-office', () => HttpResponse.json(mockByOffice)),
  http.get('/api/mail-sends', ({ request }) => {
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const officeId = url.searchParams.get('officeId');
    const userId = url.searchParams.get('userId');
    let result = [...mailSends];
    if (dateFrom) result = result.filter(m => m.sendMonth >= dateFrom);
    if (dateTo) result = result.filter(m => m.sendMonth <= dateTo);
    if (officeId) result = result.filter(m => m.officeId === Number(officeId));
    if (userId) result = result.filter(m => m.userId === Number(userId));
    return HttpResponse.json(result);
  }),
  http.post('/api/mail-sends', async ({ request }) => {
    const body = await request.json() as { userId: number; officeId: number; sendType: string; sendMonth: string };
    const duplicate = mailSends.find(
      m => m.userId === body.userId && m.officeId === body.officeId &&
           m.sendType === body.sendType && m.sendMonth === body.sendMonth
    );
    if (duplicate) return new HttpResponse(null, { status: 409 });
    const user = users.find(u => u.id === body.userId);
    const office = offices.find(o => o.id === body.officeId);
    const newMs = {
      id: nextMailSendId++,
      userId: body.userId,
      officeId: body.officeId,
      userName: user?.name ?? '',
      officeName: office?.name ?? '',
      sendType: body.sendType as 'PLAN' | 'MONITORING',
      sendMonth: body.sendMonth,
      status: 'PENDING' as const,
      isOverdue: false,
      batchId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mailSends.push(newMs);
    return HttpResponse.json(newMs, { status: 201 });
  }),
  http.post('/api/mail-send-batches', async ({ request }) => {
    const body = await request.json() as { mailSendIds: number[] };
    const batchId = Date.now();
    const sentAt = new Date().toISOString();
    mailSends = mailSends.map(m =>
      body.mailSendIds.includes(m.id)
        ? { ...m, status: 'SENT', batchId, updatedAt: sentAt }
        : m
    );
    return HttpResponse.json({ batchId, sentAt, updatedCount: body.mailSendIds.length });
  }),
  http.delete('/api/mail-sends/:id', ({ params }) => {
    mailSends = mailSends.filter(m => m.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // Users
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    return HttpResponse.json(includeInactive ? users : users.filter(u => u.isActive));
  }),
  http.get('/api/users/:id', ({ params }) => {
    const user = users.find(u => u.id === Number(params.id));
    if (!user) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...user, offices: mockUserOffices[user.id] ?? [] });
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; nameKana?: string | null; birthDate?: string | null; notes?: string | null };
    const now = new Date().toISOString();
    const newUser = { id: users.length + 10, isActive: true, createdAt: now, updatedAt: now, ...body };
    users.push(newUser as typeof users[0]);
    return HttpResponse.json(newUser, { status: 201 });
  }),
  http.put('/api/users/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof users[0]>;
    users = users.map(u => u.id === Number(params.id) ? { ...u, ...body } : u);
    return HttpResponse.json(users.find(u => u.id === Number(params.id)));
  }),
  http.delete('/api/users/:id', ({ params }) => {
    users = users.map(u => u.id === Number(params.id) ? { ...u, isActive: false } : u);
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch('/api/users/:id/activate', ({ params }) => {
    users = users.map(u => u.id === Number(params.id) ? { ...u, isActive: true } : u);
    return HttpResponse.json(users.find(u => u.id === Number(params.id)));
  }),
  http.get('/api/users/:id/offices', ({ params }) => {
    return HttpResponse.json(mockUserOffices[Number(params.id)] ?? []);
  }),
  http.post('/api/users/:id/offices', async ({ params, request }) => {
    const body = await request.json() as { officeId: number };
    const office = offices.find(o => o.id === body.officeId);
    if (!office) return new HttpResponse(null, { status: 404 });
    if (!mockUserOffices[Number(params.id)]) mockUserOffices[Number(params.id)] = [];
    mockUserOffices[Number(params.id)].push(office);
    return HttpResponse.json(office, { status: 201 });
  }),
  http.delete('/api/users/:id/offices/:officeId', ({ params }) => {
    const uid = Number(params.id);
    if (mockUserOffices[uid]) {
      mockUserOffices[uid] = mockUserOffices[uid].filter(o => o.id !== Number(params.officeId));
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Offices
  http.get('/api/offices', ({ request }) => {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    return HttpResponse.json(includeInactive ? offices : offices.filter(o => o.isActive));
  }),
  http.get('/api/offices/:id', ({ params }) => {
    const office = offices.find(o => o.id === Number(params.id));
    if (!office) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(office);
  }),
  http.post('/api/offices', async ({ request }) => {
    const body = await request.json() as { name: string; postalCode?: string | null; address?: string | null; phone?: string | null };
    const newOffice = { id: offices.length + 10, isActive: true, ...body };
    offices.push(newOffice as typeof offices[0]);
    return HttpResponse.json(newOffice, { status: 201 });
  }),
  http.put('/api/offices/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof offices[0]>;
    offices = offices.map(o => o.id === Number(params.id) ? { ...o, ...body } : o);
    return HttpResponse.json(offices.find(o => o.id === Number(params.id)));
  }),
  http.delete('/api/offices/:id', ({ params }) => {
    offices = offices.map(o => o.id === Number(params.id) ? { ...o, isActive: false } : o);
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch('/api/offices/:id/activate', ({ params }) => {
    offices = offices.map(o => o.id === Number(params.id) ? { ...o, isActive: true } : o);
    return HttpResponse.json(offices.find(o => o.id === Number(params.id)));
  }),

  // Address lookup
  http.get('/api/address/by-zipcode', ({ request }) => {
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') ?? '').replace(/-/g, '');
    const db: Record<string, { zipcode: string; address: string }[]> = {
      '1500001': [{ zipcode: '150-0001', address: '東京都渋谷区神宮前' }],
      '1600023': [{ zipcode: '160-0023', address: '東京都新宿区西新宿' }],
      '1300021': [{ zipcode: '130-0021', address: '東京都墨田区緑' }],
      '1700013': [{ zipcode: '170-0013', address: '東京都豊島区東池袋' }],
    };
    return HttpResponse.json(db[code] ?? []);
  }),
  http.get('/api/address/by-address', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const all = [
      { zipcode: '150-0001', address: '東京都渋谷区神宮前' },
      { zipcode: '160-0023', address: '東京都新宿区西新宿' },
      { zipcode: '130-0021', address: '東京都墨田区緑' },
      { zipcode: '170-0013', address: '東京都豊島区東池袋' },
    ];
    const results = all.filter(r => r.address.includes(q));
    return HttpResponse.json(results);
  }),

  // Staffs
  http.get('/api/staffs', () => HttpResponse.json(staffs)),
  http.get('/api/staffs/:id', ({ params }) => {
    const staff = staffs.find(s => s.id === Number(params.id));
    if (!staff) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(staff);
  }),
  http.post('/api/staffs', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; role: string };
    const newStaff = { id: staffs.length + 10, isActive: true, ...body };
    staffs.push(newStaff as typeof staffs[0]);
    return HttpResponse.json(newStaff, { status: 201 });
  }),
  http.put('/api/staffs/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof staffs[0]>;
    staffs = staffs.map(s => s.id === Number(params.id) ? { ...s, ...body } : s);
    return HttpResponse.json(staffs.find(s => s.id === Number(params.id)));
  }),
  http.patch('/api/staffs/:id/disable', ({ params }) => {
    staffs = staffs.map(s => s.id === Number(params.id) ? { ...s, isActive: false } : s);
    return HttpResponse.json(staffs.find(s => s.id === Number(params.id)));
  }),
];
