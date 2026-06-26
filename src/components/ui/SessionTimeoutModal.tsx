import { useEffect, useRef } from 'react';
import { Dialog, DialogBody } from '@/components/dads/v1/Dialog/Dialog';
import { Button } from '@/components/dads/Button/Button';

type Props = {
  isOpen: boolean;
  remainingMs: number;
  onExtend: () => void;
};

const formatRemaining = (ms: number) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
};

export const SessionTimeoutModal = ({ isOpen, remainingMs, onExtend }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <Dialog ref={dialogRef} className="w-full max-w-md">
      <DialogBody className="w-full">
        <h2 className="text-std-17B-170 w-full">セッションの有効期限が近づいています</h2>
        <p className="text-std-16N-170 text-solid-gray-800">
          操作がないため、まもなく自動的にログアウトされます。
        </p>
        <p className="text-std-32B-150 text-center text-error-red" aria-live="polite" aria-atomic="true">
          残り {formatRemaining(remainingMs)}
        </p>
        <div className="flex w-full justify-end">
          <Button type="button" variant="solid-fill" size="md" onClick={onExtend}>
            セッションを延長する
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
};
