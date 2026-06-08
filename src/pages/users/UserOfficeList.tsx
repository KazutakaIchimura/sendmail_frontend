import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeUserOffice } from '@/api/users';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/dads/Button/Button';
import type { Office } from '@/types/office';

type Props = {
  userId: number;
  offices: Office[];
  onAddClick: () => void;
};

export const UserOfficeList = ({ userId, offices, onAddClick }: Props) => {
  const queryClient = useQueryClient();
  const [removingOffice, setRemovingOffice] = useState<Office | null>(null);

  const mutation = useMutation({
    mutationFn: (officeId: number) => removeUserOffice({ userId, officeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', String(userId)] });
      setRemovingOffice(null);
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-std-17B-170 text-solid-gray-900">【紐付き事業所】</h2>
        <Button variant="outline" size="sm" onClick={onAddClick}>＋ 事業所を追加</Button>
      </div>
      {offices.length === 0 ? (
        <p className="text-std-14N-130 text-solid-gray-500">紐付き事業所がありません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offices.map(office => (
            <li key={office.id} className="bg-white rounded-8 border border-solid-gray-200 px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-std-14B-130 text-solid-gray-900">🏢 {office.name}</p>
                {office.address && <p className="text-std-14N-130 text-solid-gray-600 mt-0.5">{office.postalCode ? `〒${office.postalCode} ` : ''}{office.address}</p>}
              </div>
              <Button variant="outline" size="xs" className="shrink-0 border-red-300 text-red-600 hover:bg-red-50" onClick={() => setRemovingOffice(office)}>
                紐付け解除
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!removingOffice}
        title="紐付けを解除しますか？"
        description={`${removingOffice?.name} との紐付けを解除します。この操作は取り消せません。`}
        confirmLabel="解除する"
        isDanger
        onConfirm={() => removingOffice && mutation.mutate(removingOffice.id)}
        onCancel={() => setRemovingOffice(null)}
      />
    </section>
  );
};
