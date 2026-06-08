import { Checkbox } from '@/components/dads/Checkbox/Checkbox';
import { MailSendRow } from './MailSendRow';
import type { MailSendByOffice } from '@/types/mailSend';

type Props = {
  group: MailSendByOffice;
  selectedIds: number[];
  onToggle: (id: number) => void;
};

export const OfficeMailSendGroup = ({ group, selectedIds, onToggle }: Props) => {
  const pendingIds = group.mailSends.filter(m => m.status === 'PENDING').map(m => m.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.includes(id));
  const someSelected = pendingIds.some(id => selectedIds.includes(id));

  const toggleAll = () => {
    if (allSelected) {
      pendingIds.forEach(id => selectedIds.includes(id) && onToggle(id));
    } else {
      pendingIds.forEach(id => !selectedIds.includes(id) && onToggle(id));
    }
  };

  return (
    <div className="bg-white rounded-8 border border-solid-gray-200 overflow-hidden">
      <div className="bg-solid-gray-50 px-4 py-3 border-b border-solid-gray-200 flex items-start gap-3">
        {pendingIds.length > 0 && (
          <Checkbox
            id={`office-all-${group.office.id}`}
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={toggleAll}
            aria-label={`${group.office.name} の送付待ちを全て選択`}
          />
        )}
        <div>
          <p className="text-std-14B-130 text-solid-gray-900">🏢 {group.office.name}</p>
          {group.office.address && (
            <p className="text-std-14N-130 text-solid-gray-600 mt-0.5">{group.office.address}</p>
          )}
        </div>
      </div>
      <ul className="divide-y divide-solid-gray-100">
        {group.mailSends.map(ms => (
          <MailSendRow
            key={ms.id}
            mailSend={ms}
            checked={selectedIds.includes(ms.id)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </div>
  );
};
