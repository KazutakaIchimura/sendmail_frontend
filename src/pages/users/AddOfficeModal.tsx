import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogBody } from '@/components/dads/v1/Dialog/Dialog';
import { Button } from '@/components/dads/Button/Button';
import { Radio } from '@/components/dads/Radio/Radio';
import { getOffices } from '@/api/offices';
import { addUserOffice } from '@/api/users';
import type { Office } from '@/types/office';

type Props = {
  isOpen: boolean;
  userId: number;
  currentOffices: Office[];
  onClose: () => void;
  onSuccess: () => void;
};

export const AddOfficeModal = ({ isOpen, userId, currentOffices, onClose, onSuccess }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // NOTE: <dialog> のネイティブ showModal/close を React の isOpen と同期する
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) { dialog.showModal(); setSelectedId(null); } else dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const { data: allOffices = [] } = useQuery({ queryKey: ['offices'], queryFn: getOffices });
  const addableOffices = allOffices.filter(o => o.isActive && !currentOffices.some(c => c.id === o.id));

  const mutation = useMutation({
    mutationFn: (officeId: number) => addUserOffice({ userId, officeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', String(userId)] });
      onSuccess();
    },
  });

  return (
    <Dialog ref={dialogRef} className="w-full max-w-md">
      <DialogBody className="w-full">
        <h2 className="text-std-17B-170 w-full">事業所を追加</h2>
        <ul className="w-full max-h-64 overflow-y-auto rounded-8 border border-solid-gray-200 divide-y divide-solid-gray-100">
          {addableOffices.map(o => (
            <li key={o.id}>
              <label className={clsx(
                'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-solid-gray-50',
                selectedId === o.id && 'bg-green-50'
              )}>
                <Radio name="add-office" value={String(o.id)} checked={selectedId === o.id} onChange={() => setSelectedId(o.id)} />
                <span className="text-std-14N-130 text-solid-gray-900">{o.name}</span>
              </label>
            </li>
          ))}
          {addableOffices.length === 0 && <li className="px-4 py-3 text-std-14N-130 text-solid-gray-500">追加できる事業所がありません</li>}
        </ul>
        {mutation.isError && <p className="text-std-14N-130 text-red-600 w-full">しばらく待ってからもう一度お試しください</p>}
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>キャンセル</Button>
          <Button type="button" variant="solid-fill" size="md" disabled={!selectedId || mutation.isPending} onClick={() => selectedId && mutation.mutate(selectedId)}>
            {mutation.isPending ? '追加中...' : '追加する'}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
};
