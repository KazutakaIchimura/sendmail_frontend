import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Dialog, DialogBody } from '@/components/dads/v1/Dialog/Dialog';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Textarea } from '@/components/dads/Textarea/Textarea';
import { FormError } from '@/components/form/FormError';
import { createBatch } from '@/api/mailSends';
import type { MailSend } from '@/types/mailSend';

const SEND_TYPE_LABEL: Record<string, string> = { PLAN: '計画作成', MONITORING: 'モニタリング' };

/** メモの最大文字数 */
const NOTES_MAX_LENGTH = 500;

/**
 * "YYYY-MM" 形式の年月を "YYYY年M月" 形式に変換する
 */
const formatMonth = (ym: string | undefined | null) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
};

type Props = {
  isOpen: boolean;
  selectedMailSends: MailSend[];
  onClose: () => void;
  onSuccess: () => void;
};

export const BatchSendModal = ({ isOpen, selectedMailSends, onClose, onSuccess }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const queryClient = useQueryClient();

  // NOTE: <dialog> のネイティブ showModal/close を React の isOpen と同期する
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) dialog.showModal(); else { dialog.close(); setNotes(''); setNotesError(''); }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailSendsByOffice'] });
      onSuccess();
    },
  });

  /**
   * メモのバリデーションを行い、問題なければ一括送付済み処理を実行する
   */
  const handleConfirm = () => {
    if (notes.length > NOTES_MAX_LENGTH) {
      setNotesError(`メモは${NOTES_MAX_LENGTH}文字以内で入力してください`);
      return;
    }
    mutation.mutate({ mailSendIds: selectedMailSends.map(m => m.id), notes: notes || undefined });
  };

  return (
    <Dialog ref={dialogRef} className="w-full max-w-lg">
      <DialogBody className="w-full">
        <h2 className="text-std-17B-170 w-full">選択した項目を送付済みにする</h2>
        <p className="text-std-16N-170 w-full text-solid-gray-800">
          以下 {selectedMailSends.length} 件を送付済みに更新します。よろしいですか？
        </p>
        <ul className="w-full max-h-48 overflow-y-auto rounded-8 border border-solid-gray-200 divide-y divide-solid-gray-100">
          {selectedMailSends.map(ms => (
            <li key={ms.id} className="px-3 py-2 text-std-14N-130 text-solid-gray-800 flex gap-3">
              <span className="shrink-0">{ms.officeName}</span>
              <span className="shrink-0">{ms.userName}</span>
              <span>{formatMonth(ms.sendMonth)} {SEND_TYPE_LABEL[ms.sendType] ?? ms.sendType}</span>
            </li>
          ))}
        </ul>
        <div className="w-full flex flex-col gap-1">
          <Label htmlFor="batch-notes">メモ（任意）</Label>
          <Textarea
            id="batch-notes"
            rows={3}
            className="w-full"
            value={notes}
            onChange={e => { setNotes(e.target.value); setNotesError(''); }}
            isError={!!notesError}
          />
          <FormError message={notesError} />
        </div>
        {mutation.isError && (
          <p className="text-std-14N-130 text-red-600 w-full">しばらく待ってからもう一度お試しください</p>
        )}
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>キャンセル</Button>
          <Button type="button" variant="solid-fill" size="md" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? '処理中...' : '送付済みにする'}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
};
