import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/dads/Button/Button';
import type { DashboardData } from '@/api/dashboard';

type Props = {
  history: DashboardData['recentHistory'];
};

const SEND_TYPE_LABEL: Record<string, string> = {
  PLAN: '計画作成',
  MONITORING: 'モニタリング',
};

/**
 * ISO 日時文字列から "YYYY/MM/DD" 形式の日付文字列を返す
 */
const formatDate = (iso: string) => iso.slice(0, 10).replace(/-/g, '/');

export const RecentHistoryList = ({ history }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-8 border border-solid-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-std-17B-170 text-solid-gray-900"><span aria-hidden="true">📋 </span>最近の送付履歴</h2>
      </div>
      {history.length === 0 ? (
        <p className="text-std-14N-130 text-solid-gray-500">履歴はありません</p>
      ) : (
        <table className="w-full text-std-14N-130">
          <caption className="sr-only">最近の送付履歴</caption>
          <thead>
            <tr className="border-b border-solid-gray-200 text-solid-gray-500 text-left">
              <th className="pb-2 pr-4 font-normal w-28">送付日</th>
              <th className="pb-2 pr-4 font-normal">事業所</th>
              <th className="pb-2 pr-4 font-normal">利用者</th>
              <th className="pb-2 font-normal">種別</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-solid-gray-100">
            {history.map(item => (
              <tr key={item.id} className="text-solid-gray-800">
                <td className="py-2.5 pr-4 text-solid-gray-500 whitespace-nowrap">{formatDate(item.sentAt)}</td>
                <td className="py-2.5 pr-4">{item.officeName}</td>
                <td className="py-2.5 pr-4">{item.userName}</td>
                <td className="py-2.5">
                  <span className="inline-block px-2 py-0.5 rounded-4 bg-green-50 text-green-700 text-std-14N-130">
                    {SEND_TYPE_LABEL[item.sendType] ?? item.sendType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 flex justify-end">
        <Button variant="text" size="sm" onClick={() => navigate('/mail-sends/history')}>
          履歴を全て見る →
        </Button>
      </div>
    </div>
  );
};
