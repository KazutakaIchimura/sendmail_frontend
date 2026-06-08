const now = new Date();
const ym = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const mockStaffs = [
  { id: 1, name: '山田 花子', email: 'yamada@example.com', role: 'ADMIN', isActive: true },
  { id: 2, name: '鈴木 一郎', email: 'suzuki@example.com', role: 'STAFF', isActive: true },
  { id: 3, name: '佐藤 美咲', email: 'sato@example.com', role: 'STAFF', isActive: true },
  { id: 4, name: '田中 健太', email: 'tanaka@example.com', role: 'STAFF', isActive: false },
];

export const mockOffices = [
  { id: 1, name: 'グループホーム さくら', postalCode: '150-0001', address: '東京都渋谷区神宮前1-1-1', phone: '03-1234-5678', isActive: true },
  { id: 2, name: 'グループホーム ひまわり', postalCode: '160-0023', address: '東京都新宿区西新宿2-2-2', phone: '03-2345-6789', isActive: true },
  { id: 3, name: 'グループホーム つくし', postalCode: '130-0021', address: '東京都墨田区緑3-3-3', phone: '03-3456-7890', isActive: true },
  { id: 4, name: 'グループホーム もみじ', postalCode: '170-0013', address: '東京都豊島区東池袋4-4-4', phone: '03-4567-8901', isActive: false },
];

export const mockUsers = [
  { id: 1, name: '伊藤 太郎', nameKana: 'いとう たろう', birthDate: '1960-04-15', notes: '車椅子使用。移動介助が必要。', isActive: true, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-04-01T09:00:00' },
  { id: 2, name: '中村 幸子', nameKana: 'なかむら さちこ', birthDate: '1958-11-03', notes: null, isActive: true, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-04-01T09:00:00' },
  { id: 3, name: '小林 正雄', nameKana: 'こばやし まさお', birthDate: '1965-07-22', notes: '週3回のデイサービス利用中', isActive: true, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-04-01T09:00:00' },
  { id: 4, name: '加藤 恵子', nameKana: 'かとう けいこ', birthDate: '1972-01-30', notes: null, isActive: true, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-04-01T09:00:00' },
  { id: 5, name: '吉田 勇', nameKana: 'よしだ いさむ', birthDate: '1955-09-08', notes: '定期通院あり（毎月第2火曜）', isActive: true, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-04-01T09:00:00' },
  { id: 6, name: '渡辺 澄子', nameKana: 'わたなべ すみこ', birthDate: '1963-03-17', notes: null, isActive: false, createdAt: '2024-04-01T09:00:00', updatedAt: '2024-05-01T09:00:00' },
];

export const mockUserOffices: Record<number, typeof mockOffices> = {
  1: [mockOffices[0], mockOffices[2]],
  2: [mockOffices[1]],
  3: [mockOffices[0], mockOffices[1]],
  4: [mockOffices[2], mockOffices[3]],
  5: [mockOffices[3]],
  6: [mockOffices[1], mockOffices[2]],
};

export const mockMailSends = [
  // 今月 - 送付待ち
  { id: 1, userId: 1, officeId: 1, userName: '伊藤 太郎', officeName: 'グループホーム さくら', sendType: 'PLAN' as const, sendMonth: ym(0), status: 'PENDING' as const, isOverdue: false, batchId: null, createdAt: `${ym(0)}-05T09:00:00`, updatedAt: `${ym(0)}-05T09:00:00` },
  { id: 2, userId: 2, officeId: 2, userName: '中村 幸子', officeName: 'グループホーム ひまわり', sendType: 'MONITORING' as const, sendMonth: ym(0), status: 'PENDING' as const, isOverdue: false, batchId: null, createdAt: `${ym(0)}-05T09:01:00`, updatedAt: `${ym(0)}-05T09:01:00` },
  { id: 3, userId: 3, officeId: 1, userName: '小林 正雄', officeName: 'グループホーム さくら', sendType: 'PLAN' as const, sendMonth: ym(0), status: 'PENDING' as const, isOverdue: false, batchId: null, createdAt: `${ym(0)}-06T10:00:00`, updatedAt: `${ym(0)}-06T10:00:00` },
  { id: 4, userId: 4, officeId: 3, userName: '加藤 恵子', officeName: 'グループホーム つくし', sendType: 'MONITORING' as const, sendMonth: ym(0), status: 'PENDING' as const, isOverdue: false, batchId: null, createdAt: `${ym(0)}-07T11:00:00`, updatedAt: `${ym(0)}-07T11:00:00` },
  // 前月 - 期限切れ
  { id: 5, userId: 5, officeId: 4, userName: '吉田 勇', officeName: 'グループホーム もみじ', sendType: 'PLAN' as const, sendMonth: ym(-1), status: 'PENDING' as const, isOverdue: true, batchId: null, createdAt: `${ym(-1)}-10T09:00:00`, updatedAt: `${ym(-1)}-10T09:00:00` },
  { id: 6, userId: 6, officeId: 2, userName: '渡辺 澄子', officeName: 'グループホーム ひまわり', sendType: 'MONITORING' as const, sendMonth: ym(-1), status: 'PENDING' as const, isOverdue: true, batchId: null, createdAt: `${ym(-1)}-10T09:10:00`, updatedAt: `${ym(-1)}-10T09:10:00` },
  // 送付済み
  { id: 7, userId: 1, officeId: 1, userName: '伊藤 太郎', officeName: 'グループホーム さくら', sendType: 'MONITORING' as const, sendMonth: ym(-1), status: 'SENT' as const, isOverdue: false, batchId: 1, createdAt: `${ym(-1)}-01T09:00:00`, updatedAt: `${ym(-1)}-20T14:30:00` },
  { id: 8, userId: 2, officeId: 2, userName: '中村 幸子', officeName: 'グループホーム ひまわり', sendType: 'PLAN' as const, sendMonth: ym(-1), status: 'SENT' as const, isOverdue: false, batchId: 1, createdAt: `${ym(-1)}-01T09:01:00`, updatedAt: `${ym(-1)}-20T14:30:00` },
  { id: 9, userId: 3, officeId: 1, userName: '小林 正雄', officeName: 'グループホーム さくら', sendType: 'MONITORING' as const, sendMonth: ym(-2), status: 'SENT' as const, isOverdue: false, batchId: 2, createdAt: `${ym(-2)}-01T09:00:00`, updatedAt: `${ym(-2)}-18T10:00:00` },
  { id: 10, userId: 4, officeId: 3, userName: '加藤 恵子', officeName: 'グループホーム つくし', sendType: 'PLAN' as const, sendMonth: ym(-2), status: 'SENT' as const, isOverdue: false, batchId: 2, createdAt: `${ym(-2)}-01T09:05:00`, updatedAt: `${ym(-2)}-18T10:00:00` },
];

// MailSendByOffice[] 型に合わせた形
export const mockByOffice = [
  {
    office: { id: 1, name: 'グループホーム さくら', address: '東京都渋谷区神宮前1-1-1' },
    mailSends: mockMailSends.filter(m => m.officeId === 1),
  },
  {
    office: { id: 2, name: 'グループホーム ひまわり', address: '東京都新宿区西新宿2-2-2' },
    mailSends: mockMailSends.filter(m => m.officeId === 2),
  },
  {
    office: { id: 3, name: 'グループホーム つくし', address: '東京都墨田区緑3-3-3' },
    mailSends: mockMailSends.filter(m => m.officeId === 3),
  },
  {
    office: { id: 4, name: 'グループホーム もみじ', address: '東京都豊島区東池袋4-4-4' },
    mailSends: mockMailSends.filter(m => m.officeId === 4),
  },
];

const pendingCount = mockMailSends.filter(m => m.status === 'PENDING').length;
const sentCount = mockMailSends.filter(m => m.status === 'SENT').length;
const overdueMonths = [...new Set(mockMailSends.filter(m => m.isOverdue).map(m => m.sendMonth))]
  .sort()
  .map(month => ({
    month,
    count: mockMailSends.filter(m => m.isOverdue && m.sendMonth === month).length,
  }));

// DashboardData 型に合わせた形
export const mockDashboard = {
  currentMonth: ym(0),
  pendingCount,
  overdueCount: mockMailSends.filter(m => m.isOverdue).length,
  sentThisMonthCount: sentCount,
  overdueMonths,
  recentHistory: mockMailSends
    .filter(m => m.status === 'SENT')
    .slice(0, 5)
    .map(m => ({
      id: m.id,
      officeName: m.officeName,
      userName: m.userName,
      sendType: m.sendType,
      sentAt: m.updatedAt,
    })),
};
