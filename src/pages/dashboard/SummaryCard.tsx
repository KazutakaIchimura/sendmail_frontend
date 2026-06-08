import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/dads/Button/Button';
import { Furigana } from '@/components/ui/Furigana';

type Props = {
  label: string;
  count: number;
  icon: string;
  isAlert?: boolean;
  linkTo?: string;
};

export const SummaryCard = ({ label, count, icon, isAlert, linkTo }: Props) => {
  const navigate = useNavigate();

  return (
    <div className={clsx(
      'bg-white rounded-8 border p-5 flex flex-col gap-3',
      isAlert && count > 0 ? 'border-orange-300 bg-orange-50' : 'border-solid-gray-200'
    )}>
      <div className="flex items-center gap-2 text-std-14N-130 text-solid-gray-700">
        <span aria-hidden="true">{icon}</span>
        <Furigana text={label} />
      </div>
      <p className={clsx(
        'text-std-32B-150',
        isAlert && count > 0 ? 'text-orange-700' : 'text-solid-gray-900'
      )}>
        <span aria-label={`${count}件`}>{count}</span>
        <span className="text-std-16N-170 ml-1" aria-hidden="true">件</span>
      </p>
      {linkTo && (
        <Button variant="outline" size="sm" aria-label={`${label}の一覧を見る`} onClick={() => navigate(linkTo)}>
          一覧を見る
        </Button>
      )}
    </div>
  );
};
