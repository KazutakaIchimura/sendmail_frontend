import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStaffs, disableStaff, activateStaff } from '@/api/staffs';
import { useAuth } from '@/contexts/AuthContext';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Furigana } from '@/components/ui/Furigana';
import type { Staff } from '@/types/staff';

const ROLE_LABEL: Record<string, string> = { ADMIN: '🔑 ADMIN', STAFF: '👤 STAFF' };

/** ADMINの最低維持人数 */
const MIN_ADMIN_COUNT = 1;

export const StaffListPage = () => {
  const navigate = useNavigate();
  const { currentStaff } = useAuth();
  const queryClient = useQueryClient();
  const [disablingStaff, setDisablingStaff] = useState<Staff | null>(null);

  const { data: staffs = [], isLoading } = useQuery({
    queryKey: ['staffs'],
    queryFn: () => getStaffs({ includeInactive: true }),
  });

  const adminCount = staffs.filter(s => s.role === 'ADMIN' && s.isActive).length;

  const disableMutation = useMutation({
    mutationFn: (id: number) => disableStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] });
      setDisablingStaff(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staffs'] }),
  });

  /**
   * スタッフを無効化できるか判定する。
   * 自分自身・最後のADMIN は無効化不可
   */
  const canDisable = (s: Staff) => {
    if (s.id === currentStaff?.id) return false;
    if (s.role === 'ADMIN' && adminCount <= MIN_ADMIN_COUNT) return false;
    return s.isActive;
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle><Furigana text="🔑 スタッフ管理 " /><span className="text-std-14N-130 text-solid-gray-500">※管理者のみ</span></PageTitle>
        <Button variant="solid-fill" size="md" onClick={() => navigate('/staffs/new')}>
          ➕ 新規登録
        </Button>
      </div>

      {isLoading && <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>}

      <ul className="flex flex-col gap-2">
        {staffs.map(s => (
          <li key={s.id} className={clsx(
            'bg-white rounded-8 border border-solid-gray-200 px-4 py-4 flex items-center justify-between gap-4',
            !s.isActive && 'opacity-60'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-std-16N-170 text-solid-gray-900 font-medium">{s.name}
                {s.id === currentStaff?.id && <span className="ml-2 text-xs text-green-700">（自分）</span>}
              </p>
              <p className="text-std-14N-130 text-solid-gray-600">{s.email}</p>
            </div>
            <span className="text-std-14N-130 text-solid-gray-700 shrink-0">{s.isActive ? ROLE_LABEL[s.role] : '※無効'}</span>
            <div className="flex gap-2 shrink-0">
              {!s.isActive && (
                <Button variant="outline" size="xs" onClick={() => activateMutation.mutate(s.id)}>
                  有効に戻す
                </Button>
              )}
              {s.isActive && canDisable(s) && (
                <Button variant="outline" size="xs" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDisablingStaff(s)}>
                  無効にする
                </Button>
              )}
              {s.isActive && (
                <Button variant="outline" size="xs" onClick={() => navigate(`/staffs/${s.id}/edit`)}>
                  編集
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        isOpen={!!disablingStaff}
        title="スタッフを無効にしますか？"
        description={`${disablingStaff?.name} を無効にします。ログインできなくなります。`}
        confirmLabel="無効にする"
        isDanger
        onConfirm={() => disablingStaff && disableMutation.mutate(disablingStaff.id)}
        onCancel={() => setDisablingStaff(null)}
      />
    </div>
  );
};
