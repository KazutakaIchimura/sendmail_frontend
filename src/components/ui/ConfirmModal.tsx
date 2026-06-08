import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBody } from '@/components/dads/v1/Dialog/Dialog';
import { Button } from '@/components/dads/Button/Button';
import { Textarea } from '@/components/dads/Textarea/Textarea';
import { Label } from '@/components/dads/Label/Label';

type Props = {
  isOpen: boolean;
  title: string;
  description: string;
  items?: string[];
  noteLabel?: string;
  confirmLabel?: string;
  isDanger?: boolean;
  onConfirm: (note?: string) => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  isOpen,
  title,
  description,
  items,
  noteLabel,
  confirmLabel = '確認',
  isDanger = false,
  onConfirm,
  onCancel,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState('');

  // NOTE: <dialog> のネイティブ showModal/close を React の isOpen と同期する
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
      setNote('');
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onCancel();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onCancel]);

  return (
    <Dialog ref={dialogRef} className="w-full max-w-lg">
      <DialogBody className="w-full">
        <h2 className="text-std-17B-170 w-full">{title}</h2>
        <p className="text-std-16N-170 w-full text-solid-gray-800">{description}</p>
        {items && items.length > 0 && (
          <ul className="w-full max-h-40 overflow-y-auto rounded border border-solid-gray-200 p-3 text-std-14N-130 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-solid-gray-800">{item}</li>
            ))}
          </ul>
        )}
        {noteLabel && (
          <div className="w-full flex flex-col gap-1">
            <Label htmlFor="confirm-note">{noteLabel}</Label>
            <Textarea
              id="confirm-note"
              rows={3}
              className="w-full"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        )}
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="solid-fill"
            size="md"
            className={isDanger ? 'bg-error-red border-error-red hover:bg-red-700' : ''}
            onClick={() => onConfirm(noteLabel ? note : undefined)}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
};
