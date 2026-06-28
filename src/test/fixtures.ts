import type { Staff, RoleOption } from '@/types/staff';
import type { User, UserWithOffices } from '@/types/user';
import type { Office } from '@/types/office';
import type { MailSend } from '@/types/mailSend';
import type { DashboardData } from '@/api/dashboard';

export const adminStaff: Staff = {
  id: 1,
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'ADMIN',
  roleId: 1,
  isActive: true,
  forcePasswordChange: false,
  accessibilitySettings: null,
  createdAt: '2026-01-01T00:00:00Z',
};

export const staffMember: Staff = {
  id: 2,
  name: '鈴木 花子',
  email: 'suzuki@example.com',
  role: 'STAFF',
  roleId: 2,
  isActive: true,
  forcePasswordChange: false,
  accessibilitySettings: null,
  createdAt: '2026-01-02T00:00:00Z',
};

export const inactiveStaff: Staff = {
  id: 3,
  name: '田中 一郎',
  email: 'tanaka@example.com',
  role: 'STAFF',
  roleId: 2,
  isActive: false,
  forcePasswordChange: false,
  accessibilitySettings: null,
  createdAt: '2026-01-03T00:00:00Z',
};

export const roleOptions: RoleOption[] = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'STAFF' },
];

export const officeA: Office = {
  id: 10,
  name: '事業所A グループホーム',
  officeType: '共同生活援助（グループホーム）',
  postalCode: '123-4567',
  address: '東京都○○区1-2-3',
  building: null,
  phone: '03-1111-2222',
  isActive: true,
};

export const officeB: Office = {
  id: 11,
  name: '事業所B 就労支援センター',
  officeType: '就労継続支援B型',
  postalCode: '456-7890',
  address: '神奈川県△△市4-5-6',
  building: null,
  phone: '045-3333-4444',
  isActive: true,
};

export const inactiveOffice: Office = {
  id: 12,
  name: '事業所C（無効）',
  officeType: null,
  postalCode: '789-0123',
  address: '埼玉県××市7-8-9',
  building: null,
  phone: null,
  isActive: false,
};

/** userTanakaWithOffices（[officeA, officeB]）には紐付いていない、追加可能な事業所 */
export const officeD: Office = {
  id: 13,
  name: '事業所D 自立訓練センター',
  officeType: '自立訓練（生活訓練）',
  postalCode: '321-0987',
  address: '千葉県□□市1-1-1',
  building: null,
  phone: '043-5555-6666',
  isActive: true,
};

export const userTanaka: User = {
  id: 100,
  name: '田中 太郎',
  nameKana: 'たなか たろう',
  birthDate: '1985-04-01',
  notes: null,
  recipientNumber: null,
  disabilitySupportCategory: null,
  isActive: true,
  assignedStaffId: null,
  assignedStaffName: null,
  createdAt: '2026-01-10T00:00:00Z',
  updatedAt: '2026-01-10T00:00:00Z',
};

export const userYamada: User = {
  id: 101,
  name: '山田 花子',
  nameKana: 'やまだ はなこ',
  birthDate: '1990-06-15',
  notes: null,
  recipientNumber: null,
  disabilitySupportCategory: null,
  isActive: true,
  assignedStaffId: null,
  assignedStaffName: null,
  createdAt: '2026-01-11T00:00:00Z',
  updatedAt: '2026-01-11T00:00:00Z',
};

export const inactiveUser: User = {
  id: 102,
  name: '佐藤 次郎',
  nameKana: 'さとう じろう',
  birthDate: null,
  notes: null,
  recipientNumber: null,
  disabilitySupportCategory: null,
  isActive: false,
  assignedStaffId: null,
  assignedStaffName: null,
  createdAt: '2026-01-12T00:00:00Z',
  updatedAt: '2026-01-12T00:00:00Z',
};

export const userTanakaWithOffices: UserWithOffices = {
  ...userTanaka,
  offices: [officeA, officeB],
};

export const mailSendPending: MailSend = {
  id: 1000,
  userId: userTanaka.id,
  userName: userTanaka.name,
  officeId: officeA.id,
  officeName: officeA.name,
  sendType: 'PLAN',
  sendMonth: '2026-06',
  status: 'PENDING',
  isOverdue: false,
  batchId: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

export const mailSendOverdue: MailSend = {
  id: 1001,
  userId: userTanaka.id,
  userName: userTanaka.name,
  officeId: officeA.id,
  officeName: officeA.name,
  sendType: 'PLAN',
  sendMonth: '2026-04',
  status: 'PENDING',
  isOverdue: true,
  batchId: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

export const mailSendSent: MailSend = {
  id: 1002,
  userId: userYamada.id,
  userName: userYamada.name,
  officeId: officeB.id,
  officeName: officeB.name,
  sendType: 'MONITORING',
  sendMonth: '2026-06',
  status: 'SENT',
  isOverdue: false,
  batchId: 5000,
  createdAt: '2026-06-02T00:00:00Z',
  updatedAt: '2026-06-02T00:00:00Z',
};

export const mailSendsByOffice = [
  { office: officeA, mailSends: [mailSendPending, mailSendOverdue] },
  { office: officeB, mailSends: [mailSendSent] },
];

export const dashboardData: DashboardData = {
  currentMonth: '2026-06',
  pendingCount: 2,
  overdueCount: 1,
  sentThisMonthCount: 1,
  overdueMonths: [{ month: '2026-04', count: 1 }],
  recentHistory: [
    { id: 1, officeName: officeA.name, userName: userTanaka.name, sendType: 'PLAN', sentAt: '2026-06-02T00:00:00Z' },
    { id: 2, officeName: officeB.name, userName: userYamada.name, sendType: 'MONITORING', sentAt: '2026-06-01T00:00:00Z' },
  ],
};

export const dashboardDataNoOverdue: DashboardData = {
  ...dashboardData,
  overdueCount: 0,
  overdueMonths: [],
};
