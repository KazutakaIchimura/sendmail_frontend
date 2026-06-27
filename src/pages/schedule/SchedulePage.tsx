import clsx from 'clsx';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedule, saveMonitoringCycle } from '@/api/monitoringCycles';
import { useAuth } from '@/contexts/AuthContext';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { Select } from '@/components/dads/Select/Select';
import { Textarea } from '@/components/dads/Textarea/Textarea';
import { Dialog, DialogBody } from '@/components/dads/v1/Dialog/Dialog';
import type { MonitoringCycle, SaveMonitoringCycleRequest } from '@/types/monitoringCycle';
import { useEffect, useRef } from 'react';

const CYCLE_OPTIONS = [
  { value: 1, label: '毎月（1ヶ月）' },
  { value: 3, label: '3ヶ月ごと' },
  { value: 6, label: '6ヶ月ごと' },
  { value: 12, label: '12ヶ月ごと' },
];

/** 日付文字列を "YYYY年M月D日" に変換。null の場合は "未設定" */
const formatDate = (d: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
};

/**
 * 日付と今日を比較してステータスを返す
 * - null → 'unset'
 * - 過去 → 'overdue'
 * - 30日以内 → 'soon'
 * - それ以上先 → 'ok'
 */
const getDateStatus = (d: string | null): 'unset' | 'overdue' | 'soon' | 'ok' => {
  if (!d) return 'unset';
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 30) return 'soon';
  return 'ok';
};

/** 行全体のステータス（3日付のうち最も緊急なもの） */
const getRowStatus = (mc: MonitoringCycle): 'overdue' | 'soon' | 'ok' | 'unset' => {
  const statuses = [
    getDateStatus(mc.nextMonitoringDate),
    getDateStatus(mc.nextPlanDraftDate),
    getDateStatus(mc.nextPlanDate),
  ];
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.includes('soon')) return 'soon';
  if (statuses.every(s => s === 'unset')) return 'unset';
  return 'ok';
};

type DateCellProps = { date: string | null };

const DateCell = ({ date }: DateCellProps) => {
  const status = getDateStatus(date);
  const label = formatDate(date);
  if (!label) return <span className="text-solid-gray-400">未設定</span>;
  return (
    <span className={clsx(
      status === 'overdue' && 'text-red-600 font-bold',
      status === 'soon' && 'text-orange-600 font-bold',
      status === 'ok' && 'text-solid-gray-800',
    )}>
      {status === 'overdue' && '🔴 '}
      {status === 'soon' && '🟡 '}
      {label}
    </span>
  );
};

type EditModalProps = {
  mc: MonitoringCycle | null;
  canEdit: boolean;
  onClose: () => void;
};

const EditModal = ({ mc, canEdit, onClose }: EditModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SaveMonitoringCycleRequest>({
    cycleMonths: 6,
    nextMonitoringDate: null,
    nextPlanDraftDate: null,
    nextPlanDate: null,
    notes: null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (mc) {
      setForm({
        cycleMonths: mc.cycleMonths ?? 6,
        nextMonitoringDate: mc.nextMonitoringDate,
        nextPlanDraftDate: mc.nextPlanDraftDate,
        nextPlanDate: mc.nextPlanDate,
        notes: mc.notes,
      });
      setError('');
    }
  }, [mc]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mc) dialog.showModal(); else dialog.close();
  }, [mc]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: () => saveMonitoringCycle({ userId: mc!.userId, data: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      onClose();
    },
    onError: () => setError('保存に失敗しました。しばらく待ってからもう一度お試しください'),
  });

  const setDate = (field: keyof SaveMonitoringCycleRequest, value: string) => {
    setForm(f => ({ ...f, [field]: value || null }));
  };

  return (
    <Dialog ref={dialogRef} className="w-full max-w-lg">
      <DialogBody className="w-full">
        <h2 className="text-std-17B-170 w-full">
          {mc?.userName} のモニタリング設定
        </h2>
        {!canEdit && (
          <p className="text-std-14N-130 text-solid-gray-500 w-full bg-solid-gray-50 rounded-8 px-3 py-2">
            ℹ️ 担当として割り当てられていないため、閲覧のみできます
          </p>
        )}

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <Label htmlFor="cycleMonths">モニタリング周期</Label>
            <Select
              id="cycleMonths"
              value={form.cycleMonths}
              onChange={e => setForm(f => ({ ...f, cycleMonths: Number(e.target.value) }))}
              disabled={!canEdit}
            >
              {CYCLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="nextMonitoringDate">次回モニタリング予定日</Label>
            <Input
              id="nextMonitoringDate"
              type="date"
              value={form.nextMonitoringDate ?? ''}
              onChange={e => setDate('nextMonitoringDate', e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="nextPlanDraftDate">次回計画案の提出予定日</Label>
            <Input
              id="nextPlanDraftDate"
              type="date"
              value={form.nextPlanDraftDate ?? ''}
              onChange={e => setDate('nextPlanDraftDate', e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="nextPlanDate">次回本計画の提出予定日</Label>
            <Input
              id="nextPlanDate"
              type="date"
              value={form.nextPlanDate ?? ''}
              onChange={e => setDate('nextPlanDate', e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="mc-notes">メモ（任意）</Label>
            <Textarea
              id="mc-notes"
              rows={2}
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))}
              disabled={!canEdit}
            />
          </div>
        </div>

        {error && <p className="text-std-14N-130 text-red-600 w-full" role="alert">{error}</p>}

        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {canEdit ? 'キャンセル' : '閉じる'}
          </Button>
          {canEdit && (
            <Button
              type="button"
              variant="solid-fill"
              size="md"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? '保存中...' : '保存する'}
            </Button>
          )}
        </div>
      </DialogBody>
    </Dialog>
  );
};

export const SchedulePage = () => {
  const { currentStaff, isAdmin } = useAuth();
  const [editTarget, setEditTarget] = useState<MonitoringCycle | null>(null);

  const { data: schedule = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['schedule'],
    queryFn: getSchedule,
  });

  const canEdit = (mc: MonitoringCycle) =>
    isAdmin || mc.assignedStaffId === currentStaff?.id;

  const rowStatus = (mc: MonitoringCycle) => getRowStatus(mc);

  if (isLoading) return <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>;
  if (isError) return (
    <div className="flex items-center gap-3">
      <p className="text-std-14N-130 text-red-600" role="alert">データの取得に失敗しました</p>
      <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>
        {isFetching ? '再読み込み中...' : '再読み込み'}
      </Button>
    </div>
  );

  const overdue = schedule.filter(mc => rowStatus(mc) === 'overdue');
  const soon = schedule.filter(mc => rowStatus(mc) === 'soon');
  const ok = schedule.filter(mc => rowStatus(mc) === 'ok' || rowStatus(mc) === 'unset');

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 min-w-0">
      <PageTitle>📅 スケジュール管理</PageTitle>

      <p className="text-std-14N-130 text-solid-gray-600">
        利用者ごとのモニタリング・計画案・本計画の提出予定日を管理します。
        {!isAdmin && '担当として割り当てられている利用者の設定のみ変更できます。'}
      </p>

      {schedule.length === 0 && (
        <p className="text-std-14N-130 text-solid-gray-500">
          モニタリング設定が登録されている利用者がいません。利用者詳細ページから設定を追加してください。
        </p>
      )}

      {[
        { label: '🔴 期限切れ', items: overdue, headerClass: 'bg-red-50 border-red-200' },
        { label: '🟡 今月中（30日以内）', items: soon, headerClass: 'bg-orange-50 border-orange-200' },
        { label: '✅ 期限内・未設定', items: ok, headerClass: 'bg-solid-gray-50 border-solid-gray-200' },
      ].filter(g => g.items.length > 0).map(group => (
        <section key={group.label}>
          <h2 className={clsx(
            'text-std-14B-130 px-3 py-2 rounded-t-8 border',
            group.headerClass,
          )}>
            {group.label}（{group.items.length}件）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-t-0 border-solid-gray-200 text-std-14N-130">
              <thead>
                <tr className="bg-solid-gray-50 border-b border-solid-gray-200">
                  <th className="text-left px-3 py-2 text-solid-gray-700 w-36">利用者名</th>
                  <th className="text-left px-3 py-2 text-solid-gray-700 w-28">担当SP</th>
                  <th className="text-center px-3 py-2 text-solid-gray-700 w-24">周期</th>
                  <th className="text-left px-3 py-2 text-solid-gray-700">次回モニタリング</th>
                  <th className="text-left px-3 py-2 text-solid-gray-700">次回計画案</th>
                  <th className="text-left px-3 py-2 text-solid-gray-700">次回本計画</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-solid-gray-100 bg-white">
                {group.items.map(mc => (
                  <tr key={mc.userId} className="hover:bg-solid-gray-50">
                    <td className="px-3 py-3">
                      <span className="font-medium text-solid-gray-900">{mc.userName}</span>
                      {mc.userNameKana && (
                        <span className="block text-xs text-solid-gray-500">{mc.userNameKana}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-solid-gray-700">
                      {mc.assignedStaffName ?? <span className="text-solid-gray-400">未設定</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-solid-gray-700">
                      {mc.cycleMonths != null ? `${mc.cycleMonths}ヶ月` : <span className="text-solid-gray-400">未設定</span>}
                    </td>
                    <td className="px-3 py-3"><DateCell date={mc.nextMonitoringDate} /></td>
                    <td className="px-3 py-3"><DateCell date={mc.nextPlanDraftDate} /></td>
                    <td className="px-3 py-3"><DateCell date={mc.nextPlanDate} /></td>
                    <td className="px-3 py-3">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setEditTarget(mc)}
                      >
                        {canEdit(mc) ? '編集' : '詳細'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <EditModal
        mc={editTarget}
        canEdit={editTarget ? canEdit(editTarget) : false}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
};
