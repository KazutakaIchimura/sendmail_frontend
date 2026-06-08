import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';
import { SummaryCard } from './SummaryCard';
import { OverdueAlert } from './OverdueAlert';
import { RecentHistoryList } from './RecentHistoryList';
import { Button } from '@/components/dads/Button/Button';
import { PageTitle } from '@/components/ui/PageTitle';

/**
 * "YYYY-MM" 形式の年月を "YYYY年M月" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  if (isLoading) return <p className="text-std-14N-130 text-solid-gray-500">読み込み中...</p>;
  if (isError || !data) return <p className="text-std-14N-130 text-red-600">データの取得に失敗しました</p>;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageTitle><span aria-hidden="true">📅 </span>{formatMonth(data.currentMonth)}</PageTitle>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          icon="⏳"
          label="送付待ち"
          count={data.pendingCount}
          isAlert
          linkTo="/mail-sends/by-office?status=PENDING"
        />
        <SummaryCard icon="✅" label="送付済み(今月)" count={data.sentThisMonthCount} />
        <SummaryCard icon="🚨" label="期限切れ" count={data.overdueCount} isAlert />
      </div>

      <OverdueAlert overdueMonths={data.overdueMonths ?? []} />

      <RecentHistoryList history={data.recentHistory ?? []} />

      <div className="flex gap-3">
        <Button variant="solid-fill" size="md" onClick={() => navigate('/mail-sends/new')}>
          ➕ 送付物を新規登録
        </Button>
        <Button variant="outline" size="md" onClick={() => navigate('/mail-sends/by-office')}>
          📮 送付先別一覧
        </Button>
      </div>
    </div>
  );
};
