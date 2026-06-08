import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMailSends, exportMailSendsCsv } from '@/api/mailSends';
import { getOffices } from '@/api/offices';
import { getUsers } from '@/api/users';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Select } from '@/components/dads/Select/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MailSend } from '@/types/mailSend';

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = String(NOW.getMonth() + 1).padStart(2, '0');
const PREV_MONTH = NOW.getMonth() === 0
  ? `${CURRENT_YEAR - 1}-12`
  : `${CURRENT_YEAR}-${String(NOW.getMonth()).padStart(2, '0')}`;

const SEND_TYPE_LABEL: Record<string, string> = { PLAN: '計画作成', MONITORING: 'モニタリング' };

/**
 * "YYYY-MM" 形式の年月を "YYYY年M月" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
};

/**
 * 送付物リストをバッチIDでグループ化する。バッチなしは null キーにまとめる
 */
const groupByBatch = (mailSends: MailSend[]): Map<number | null, MailSend[]> =>
  mailSends.reduce((map, ms) => {
    const key = ms.batchId;
    return map.set(key, [...(map.get(key) ?? []), ms]);
  }, new Map<number | null, MailSend[]>());

export const HistoryPage = () => {
  const [dateFrom, setDateFrom] = useState(`${CURRENT_YEAR}-${PREV_MONTH.slice(5)}`);
  const [dateTo, setDateTo] = useState(`${CURRENT_YEAR}-${CURRENT_MONTH}`);
  const [officeId, setOfficeId] = useState('');
  const [userId, setUserId] = useState('');

  const { data: mailSends = [], isLoading } = useQuery({
    queryKey: ['mailSends', { dateFrom, dateTo, officeId, userId }],
    queryFn: () => getMailSends({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      officeId: officeId ? Number(officeId) : undefined,
      userId: userId ? Number(userId) : undefined,
    }),
  });
  const { data: offices = [] } = useQuery({ queryKey: ['offices'], queryFn: getOffices });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  /**
   * 現在のフィルタ条件で CSV をエクスポートしダウンロードする
   */
  const handleCsvExport = async () => {
    try {
      const blob = await exportMailSendsCsv({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        officeId: officeId ? Number(officeId) : undefined,
        userId: userId ? Number(userId) : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mail-sends.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* NOTE: エクスポート失敗は無視（サイレント） */ }
  };

  const years = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  const sentDates = [...new Set(mailSends.map(m => m.updatedAt.slice(0, 10)))].sort().reverse();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageTitle>📋 送付履歴</PageTitle>
        <Button variant="outline" size="md" onClick={handleCsvExport}>CSV出力</Button>
      </div>

      <div className="bg-white rounded-8 border border-solid-gray-200 p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="from-year" size="sm">期間</Label>
          <Select id="from-year" blockSize="sm" value={dateFrom.slice(0, 4)} onChange={e => setDateFrom(`${e.target.value}-${dateFrom.slice(5)}`)}>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </Select>
          <Select blockSize="sm" value={dateFrom.slice(5)} onChange={e => setDateFrom(`${dateFrom.slice(0, 4)}-${e.target.value}`)}>
            {months.map(m => <option key={m} value={m}>{parseInt(m)}月</option>)}
          </Select>
          <span className="text-std-14N-130">〜</span>
          <Select blockSize="sm" value={dateTo.slice(0, 4)} onChange={e => setDateTo(`${e.target.value}-${dateTo.slice(5)}`)}>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </Select>
          <Select blockSize="sm" value={dateTo.slice(5)} onChange={e => setDateTo(`${dateTo.slice(0, 4)}-${e.target.value}`)}>
            {months.map(m => <option key={m} value={m}>{parseInt(m)}月</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-office" size="sm">事業所</Label>
          <Select id="filter-office" blockSize="sm" value={officeId} onChange={e => setOfficeId(e.target.value)}>
            <option value="">すべて</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-user" size="sm">利用者</Label>
          <Select id="filter-user" blockSize="sm" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">すべて</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}
      {!isLoading && mailSends.length === 0 && <p className="text-std-14N-130 text-solid-gray-500">該当する送付履歴はありません</p>}

      <div className="flex flex-col gap-4">
        {sentDates.map(date => {
          const dayItems = mailSends.filter(m => m.updatedAt.slice(0, 10) === date);
          const dayBatches = groupByBatch(dayItems);
          return (
            <div key={date}>
              <p className="text-std-14B-130 text-solid-gray-700 mb-2">{date.replace(/-/g, '/')}</p>
              <div className="flex flex-col gap-2">
                {[...dayBatches.entries()].map(([batchId, items]) => (
                  <div key={batchId ?? 'solo'} className="bg-white rounded-8 border border-solid-gray-200 overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 bg-solid-gray-50 border-b border-solid-gray-100 text-std-12N-130 text-solid-gray-500">
                      <span>事業所名</span>
                      <span>氏名</span>
                      <span>種別</span>
                      <span>送付月</span>
                      <span>ステータス</span>
                    </div>
                    <ul className="divide-y divide-solid-gray-100">
                      {items.map(ms => (
                        <li key={ms.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 text-std-14N-130 text-solid-gray-800">
                          <span className="font-medium truncate">{ms.officeName}</span>
                          <span className="truncate">{ms.userName}</span>
                          <span className="text-solid-gray-600">{SEND_TYPE_LABEL[ms.sendType] ?? ms.sendType}</span>
                          <span className="text-solid-gray-500">{formatMonth(ms.sendMonth)}</span>
                          <StatusBadge status={ms.status} isOverdue={ms.isOverdue} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
