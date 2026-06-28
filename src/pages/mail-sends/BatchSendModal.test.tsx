import { describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { mailSendPending } from '@/test/fixtures';
import { BatchSendModal } from './BatchSendModal';

const renderModal = (onSuccess = vi.fn(), onClose = vi.fn()) => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <BatchSendModal isOpen selectedMailSends={[mailSendPending]} onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup(), onSuccess, onClose };
};

describe('BatchSendModal', () => {
  test('選択した件数と内容が表示される', () => {
    renderModal();

    expect(screen.getByText('以下 1 件を送付済みに更新します。よろしいですか？')).toBeInTheDocument();
    expect(screen.getByText(mailSendPending.officeName)).toBeInTheDocument();
    expect(screen.getByText(mailSendPending.userName)).toBeInTheDocument();
  });

  test('メモが500文字を超えるとエラーが表示され、APIは呼ばれない', async () => {
    let called = false;
    server.use(http.post('/api/mail-send-batches', () => { called = true; return HttpResponse.json({}); }));

    const { user } = renderModal();

    fireEvent.change(screen.getByLabelText('メモ（任意）'), { target: { value: 'a'.repeat(501) } });
    await user.click(screen.getByRole('button', { name: '送付済みにする' }));

    expect(await screen.findByText('メモは500文字以内で入力してください')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  test('メモ付きで送付済みにすると、選択したIDとメモを送ってonSuccessが呼ばれる', async () => {
    let requestBody: unknown = null;
    server.use(http.post('/api/mail-send-batches', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({ id: 1, sentAt: '2026-06-23T00:00:00Z', notes: null });
    }));

    const { user, onSuccess } = renderModal();

    fireEvent.change(screen.getByLabelText('メモ（任意）'), { target: { value: '郵送完了' } });
    await user.click(screen.getByRole('button', { name: '送付済みにする' }));

    await waitFor(() => expect(requestBody).toEqual({ mailSendIds: [mailSendPending.id], notes: '郵送完了' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  test('API呼び出しが失敗するとエラーメッセージが表示される', async () => {
    server.use(http.post('/api/mail-send-batches', () => HttpResponse.json({ message: 'error' }, { status: 500 })));

    const { user } = renderModal();

    await user.click(screen.getByRole('button', { name: '送付済みにする' }));

    expect(await screen.findByText('しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });

  test('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onClose).toHaveBeenCalled();
  });

  test('API送信中は「処理中...」と表示されボタンが無効になる', async () => {
    server.use(http.post('/api/mail-send-batches', async () => {
      await new Promise<never>(() => {});
    }));

    const { user } = renderModal();
    await user.click(screen.getByRole('button', { name: '送付済みにする' }));

    expect(await screen.findByRole('button', { name: '処理中...' })).toBeDisabled();
  });
});
