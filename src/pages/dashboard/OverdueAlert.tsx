import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/dads/Button/Button';

type Props = {
  overdueMonths: { month: string; count: number }[];
};

/**
 * "YYYY-MM" 形式の年月を "YYYY年M月" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
};

export const OverdueAlert = ({ overdueMonths }: Props) => {
  const navigate = useNavigate();
  if (overdueMonths.length === 0) return null;

  const summary = overdueMonths.map(o => `${formatMonth(o.month)}分 ${o.count}件`).join('・');

  return (
    <div role="alert" className="rounded-8 bg-red-50 border border-red-200 px-5 py-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-std-14B-130 text-red-700">
          <span aria-hidden="true">🔴 </span>月遅れの送付待ちがあります
        </p>
        <p className="text-std-14N-130 text-red-600 mt-1">{summary}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label="月遅れの送付待ちを確認する"
        className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
        onClick={() => navigate('/mail-sends/by-office?status=PENDING')}
      >
        確認する
      </Button>
    </div>
  );
};
