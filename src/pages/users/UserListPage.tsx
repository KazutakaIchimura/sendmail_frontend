import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, getAllUsers, deleteUser, activateUser } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { PageTitle } from '@/components/ui/PageTitle';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Select } from '@/components/dads/Select/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { User } from '@/types/user';

export const UserListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [disablingUser, setDisablingUser] = useState<User | null>(null);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users', includeInactive],
    queryFn: () => (includeInactive ? getAllUsers() : getUsers()),
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

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="氏名・ふりがなで検索..." value={search} onChange={setSearch} />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-include-inactive" size="sm">表示</Label>
            <Select
              id="filter-include-inactive"
              blockSize="sm"
              className="w-auto"
              value={includeInactive ? 'all' : 'active'}
              onChange={e => setIncludeInactive(e.target.value === 'all')}
            >
              <option value="active">有効のみ</option>
              <option value="all">すべて表示（無効含む）</option>
            </Select>
          </div>
        )}
      </div>

      {isError && <p className="text-std-14N-130 text-red-600" role="alert">利用者一覧の取得に失敗しました。しばらく待ってからもう一度お試しください</p>}
      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}

      <ul className="flex flex-col gap-2">
        {filtered.map(u => (
          <li key={u.id} className={clsx(
            'bg-white rounded-8 border border-solid-gray-200 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
            !u.isActive && 'opacity-60'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-std-16N-170 text-solid-gray-900 font-medium">
                {u.name}
                {u.nameKana && <span className="text-std-14N-130 text-solid-gray-500 ml-2">{u.nameKana}</span>}
                {!u.isActive && <span className="ml-2 text-xs text-solid-gray-500">※無効</span>}
              </p>
              <p className="text-std-14N-130 text-solid-gray-500 mt-0.5">
                担当: {u.assignedStaffName ?? '未設定'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
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
