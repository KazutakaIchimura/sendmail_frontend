type Props = {
  status: 'PENDING' | 'SENT' | 'DONE';
  isOverdue?: boolean;
};

export const StatusBadge = ({ status, isOverdue }: Props) => {
  if (status === 'PENDING' && isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        🔴 遅れ
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
        ⏳ 送付待ち
      </span>
    );
  }
  if (status === 'SENT') {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        ✅ 送付済み
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      🏁 完了
    </span>
  );
};
