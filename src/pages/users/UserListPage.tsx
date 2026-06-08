import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, deleteUser, activateUser } from '@/api/users';
import { PageTitle } from '@/components/ui/PageTitle';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/dads/Button/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { User } from '@/types/user';

export const UserListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [disablingUser, setDisablingUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: getAllUsers,
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDisablingUser(null);
    },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filtered = users.filter(u =>
    u.name.includes(search) || (u.nameKana ?? '').includes(search)
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>👤 利用者管理</PageTitle>
        <Button variant="solid-fill" size="md" onClick={() => navigate('/users/new')}>
          ➕ 新規登録
        </Button>
      </div>

      <SearchInput placeholder="氏名・ふりがなで検索..." value={search} onChange={setSearch} />

      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}

      <ul className="flex flex-col gap-2">
        {filtered.map(u => (
          <li key={u.id} className={clsx(
            'bg-white rounded-8 border border-solid-gray-200 px-4 py-4 flex items-center justify-between gap-4',
            !u.isActive && 'opacity-60'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-std-16N-170 text-solid-gray-900 font-medium">
                {u.name}
                {u.nameKana && <span className="text-std-14N-130 text-solid-gray-500 ml-2">{u.nameKana}</span>}
                {!u.isActive && <span className="ml-2 text-xs text-solid-gray-500">※無効</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!u.isActive && (
                <Button variant="outline" size="xs" onClick={() => enableMutation.mutate(u.id)}>
                  有効に戻す
                </Button>
              )}
              {u.isActive && (
                <Button variant="outline" size="xs" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDisablingUser(u)}>
                  無効にする
                </Button>
              )}
              <Button variant="outline" size="xs" onClick={() => navigate(`/users/${u.id}`)}>
                詳細を見る
              </Button>
            </div>
          </li>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-std-14N-130 text-solid-gray-500">該当する利用者がいません</p>
        )}
      </ul>

      <ConfirmModal
        isOpen={!!disablingUser}
        title="利用者を無効にしますか？"
        description={`${disablingUser?.name} を無効にします。送付物を新規登録できなくなります。`}
        confirmLabel="無効にする"
        isDanger
        onConfirm={() => { if (disablingUser) { setDisablingUser(null); disableMutation.mutate(disablingUser.id); } }}
        onCancel={() => setDisablingUser(null)}
      />
    </div>
  );
};
