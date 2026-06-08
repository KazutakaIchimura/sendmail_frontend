import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllOffices, deleteOffice, activateOffice } from '@/api/offices';
import { PageTitle } from '@/components/ui/PageTitle';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/dads/Button/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Office } from '@/types/office';

export const OfficeListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [disablingOffice, setDisablingOffice] = useState<Office | null>(null);

  const { data: offices = [], isLoading } = useQuery({
    queryKey: ['offices', 'all'],
    queryFn: getAllOffices,
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => deleteOffice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      setDisablingOffice(null);
    },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => activateOffice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });

  const filtered = offices.filter(o => o.name.includes(search));

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>🏢 事業所管理</PageTitle>
        <Button variant="solid-fill" size="md" onClick={() => navigate('/offices/new')}>
          ➕ 新規登録
        </Button>
      </div>

      <SearchInput placeholder="事業所名で検索..." value={search} onChange={setSearch} />

      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}

      <ul className="flex flex-col gap-2">
        {filtered.map(o => (
          <li key={o.id} className={clsx(
            'bg-white rounded-8 border border-solid-gray-200 px-4 py-4 flex items-center justify-between gap-4',
            !o.isActive && 'opacity-60'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-std-16N-170 text-solid-gray-900 font-medium">
                {o.name}
                {!o.isActive && <span className="ml-2 text-xs text-solid-gray-500">※無効</span>}
              </p>
              {(o.postalCode || o.address) && (
                <p className="text-std-14N-130 text-solid-gray-600 mt-0.5">
                  {o.postalCode ? `〒${o.postalCode} ` : ''}{o.address}
                </p>
              )}
              {o.building && (
                <p className="text-std-14N-130 text-solid-gray-500 mt-0.5">{o.building}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!o.isActive && (
                <Button variant="outline" size="xs" onClick={() => enableMutation.mutate(o.id)}>
                  有効に戻す
                </Button>
              )}
              {o.isActive && (
                <Button variant="outline" size="xs" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDisablingOffice(o)}>
                  無効にする
                </Button>
              )}
              {o.isActive && (
                <Button variant="outline" size="xs" onClick={() => navigate(`/offices/${o.id}/edit`)}>
                  編集
                </Button>
              )}
            </div>
          </li>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-std-14N-130 text-solid-gray-500">該当する事業所がありません</p>
        )}
      </ul>

      <ConfirmModal
        isOpen={!!disablingOffice}
        title="事業所を無効にしますか？"
        description={`${disablingOffice?.name} を無効にします。送付先として選択できなくなります。`}
        confirmLabel="無効にする"
        isDanger
        onConfirm={() => { if (disablingOffice) { setDisablingOffice(null); disableMutation.mutate(disablingOffice.id); } }}
        onCancel={() => setDisablingOffice(null)}
      />
    </div>
  );
};
