import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMailSendsByOffice } from '@/api/mailSends';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Select } from '@/components/dads/Select/Select';
import { Label } from '@/components/dads/Label/Label';
import { OfficeMailSendGroup } from './OfficeMailSendGroup';
import { BatchSendModal } from './BatchSendModal';
import type { MailSend } from '@/types/mailSend';

export const ByOfficePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? '';
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['mailSendsByOffice', statusFilter],
    queryFn: () => getMailSendsByOffice(statusFilter || undefined),
  });

  const allPendingMailSends: MailSend[] = data.flatMap(g => g.mailSends.filter(m => m.status === 'PENDING'));
  const selectedMailSends = allPendingMailSends.filter(m => selectedIds.includes(m.id));

  const totalCount = data.reduce((acc, g) => acc + g.mailSends.length, 0);

  /** 送付物の選択状態をトグルする */
  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /** 送付待ち全件の選択状態をトグルする */
  const toggleAll = () => {
    const allIds = allPendingMailSends.map(m => m.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };

  const allSelected = allPendingMailSends.length > 0 && allPendingMailSends.every(m => selectedIds.includes(m.id));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>📮 送付先別一覧</PageTitle>
        <Button variant="solid-fill" size="md" onClick={() => navigate('/mail-sends/new')}>
          ➕ 送付物を新規登録
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" size="sm">ステータス:</Label>
          <Select
            id="status-filter"
            blockSize="sm"
            value={statusFilter}
            onChange={e => { setSearchParams(e.target.value ? { status: e.target.value } : {}); setSelectedIds([]); }}
          >
            <option value="">すべて</option>
            <option value="PENDING">送付待ち</option>
            <option value="SENT">送付済み</option>
            <option value="DONE">完了</option>
          </Select>
        </div>
        <span className="text-std-14N-130 text-solid-gray-600">{totalCount}件</span>
      </div>

      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}
      {isError && <p className="text-std-14N-130 text-red-600">データの取得に失敗しました</p>}

      {!isLoading && data.length === 0 && (
        <p className="text-std-14N-130 text-solid-gray-500">該当する送付物はありません</p>
      )}

      <div className="flex flex-col gap-4">
        {data.map(group => (
          <OfficeMailSendGroup
            key={group.office.id}
            group={group}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
          />
        ))}
      </div>

      {allPendingMailSends.length > 0 && (
        <div className="flex items-center gap-3 py-3">
          <button
            type="button"
            onClick={toggleAll}
            className="text-std-14N-130 text-green-700 underline"
          >
            {allSelected ? '☑️ 全て選択解除' : '☑️ 全て選択'}
          </button>
          <Button
            variant="solid-fill"
            size="md"
            disabled={selectedIds.length === 0}
            onClick={() => setBatchOpen(true)}
          >
            ✅ 選択した {selectedIds.length > 0 ? `${selectedIds.length}件を` : ''}送付済みにする
          </Button>
        </div>
      )}

      <BatchSendModal
        isOpen={batchOpen}
        selectedMailSends={selectedMailSends}
        onClose={() => setBatchOpen(false)}
        onSuccess={() => { setBatchOpen(false); setSelectedIds([]); }}
      />
    </div>
  );
};
