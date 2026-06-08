import clsx from 'clsx';
import { Checkbox } from '@/components/dads/Checkbox/Checkbox';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MailSend } from '@/types/mailSend';

const SEND_TYPE_LABEL: Record<string, string> = {
  PLAN: '計画作成',
  MONITORING: 'モニタリング',
};

/**
 * "YYYY-MM" 形式の年月を "YYYY年M月" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
};

type Props = {
  mailSend: MailSend;
  checked: boolean;
  onToggle: (id: number) => void;
};

export const MailSendRow = ({ mailSend, checked, onToggle }: Props) => {
  const isPending = mailSend.status === 'PENDING';

  return (
    <li className={clsx('flex items-center gap-3 py-3 px-4', mailSend.isOverdue && 'bg-red-50')}>
      {isPending && (
        <Checkbox
          id={`ms-${mailSend.id}`}
          checked={checked}
          onChange={() => onToggle(mailSend.id)}
          aria-label={`${mailSend.userName} ${formatMonth(mailSend.sendMonth)} を選択`}
        />
      )}
      {!isPending && <div className="w-5 shrink-0" />}
      <label htmlFor={isPending ? `ms-${mailSend.id}` : undefined} className="flex-1 flex items-center gap-4 cursor-pointer text-std-14N-130 text-solid-gray-800">
        <span className="w-24 shrink-0 font-medium">{mailSend.userName}</span>
        <span className="w-24 shrink-0 text-solid-gray-600">{formatMonth(mailSend.sendMonth)}</span>
        <span className="w-28 shrink-0 text-solid-gray-600">{SEND_TYPE_LABEL[mailSend.sendType] ?? mailSend.sendType}</span>
        <StatusBadge status={mailSend.status} isOverdue={mailSend.isOverdue} />
      </label>
    </li>
  );
};
