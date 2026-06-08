import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/api/users';
import { getMailSends } from '@/api/mailSends';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserOfficeList } from './UserOfficeList';
import { AddOfficeModal } from './AddOfficeModal';

const SEND_TYPE_LABEL: Record<string, string> = { PLAN: '計画作成', MONITORING: 'モニタリング' };

/** 最近の送付履歴の表示件数 */
const RECENT_HISTORY_DISPLAY_LIMIT = 5;

/**
 * ISO 日時文字列または null を "YYYY年M月D日" 形式に変換する。null の場合は "────" を返す
 */
const formatDate = (iso: string | null) => {
  if (!iso) return '────';
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

/**
 * "YYYY-MM" 形式の年月を "YYYY/M" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}/${parseInt(m)}`;
};

export const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [addOfficeOpen, setAddOfficeOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(Number(id)),
  });
  const { data: mailSends = [] } = useQuery({
    queryKey: ['mailSends', { userId: id }],
    queryFn: () => getMailSends({ userId: Number(id) }),
    enabled: !!id,
  });

  const recentHistory = mailSends.slice(0, RECENT_HISTORY_DISPLAY_LIMIT);

  if (isLoading) return <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>;
  if (!user) return <p className="text-std-14N-130 text-red-600">利用者が見つかりません</p>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/users')} className="text-std-14N-130 text-green-700 hover:underline">← 戻る</button>
        <PageTitle>👤 {user.name}</PageTitle>
        {user.isActive && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/users/${id}/edit`)}>編集</Button>
        )}
      </div>

      <section className="bg-white rounded-8 border border-solid-gray-200 divide-y divide-solid-gray-100">
        <div className="px-4 py-3">
          <h2 className="text-std-17B-170 text-solid-gray-900 mb-3">【基本情報】</h2>
        </div>
        {[
          { label: '氏名', value: user.name },
          { label: 'ふりがな', value: user.nameKana ?? '────' },
          { label: '生年月日', value: formatDate(user.birthDate) },
          { label: '備考', value: user.notes ?? '────' },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4 px-4 py-3">
            <span className="text-std-14B-130 text-solid-gray-700 w-24 shrink-0">{label}</span>
            <span className="text-std-14N-130 text-solid-gray-900">{value}</span>
          </div>
        ))}
      </section>

      <UserOfficeList
        userId={user.id}
        offices={user.offices}
        onAddClick={() => setAddOfficeOpen(true)}
      />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-std-17B-170 text-solid-gray-900">【最近の送付履歴】</h2>
          <Link to={`/mail-sends/history?userId=${id}`} className="text-std-14N-130 text-green-700 hover:underline">
            送付履歴を全て見る
          </Link>
        </div>
        {recentHistory.length === 0 ? (
          <p className="text-std-14N-130 text-solid-gray-500">送付履歴がありません</p>
        ) : (
          <ul className="bg-white rounded-8 border border-solid-gray-200 divide-y divide-solid-gray-100">
            {recentHistory.map(ms => (
              <li key={ms.id} className="px-4 py-3 flex items-center gap-3 text-std-14N-130 text-solid-gray-800">
                <span className="w-16 shrink-0 text-solid-gray-500">{formatMonth(ms.sendMonth)}</span>
                <span className="w-28 shrink-0">{ms.officeName}</span>
                <span className="flex-1">{SEND_TYPE_LABEL[ms.sendType] ?? ms.sendType}</span>
                <StatusBadge status={ms.status} isOverdue={ms.isOverdue} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddOfficeModal
        isOpen={addOfficeOpen}
        userId={user.id}
        currentOffices={user.offices}
        onClose={() => setAddOfficeOpen(false)}
        onSuccess={() => setAddOfficeOpen(false)}
      />
    </div>
  );
};
