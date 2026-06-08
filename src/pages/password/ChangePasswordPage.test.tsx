import { describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { ChangePasswordPage } from './ChangePasswordPage';

const renderChangePasswordPage = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/password/change']}>
        <Routes>
          <Route path="/password/change" element={<ChangePasswordPage />} />
          <Route path="/" element={<p>ダッシュボード画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  newPassword: string,
  confirmPassword: string
) => {
  await user.type(screen.getByLabelText(/新しいパスワード(?!（確認）)/), newPassword);
  await user.type(screen.getByLabelText('新しいパスワード（確認）必須'), confirmPassword);
  await user.click(screen.getByRole('button', { name: /変更する/ }));
};

describe('ChangePasswordPage', () => {
  test('新しいパスワードが条件を満たさない場合バリデーションエラーが表示される', async () => {
    const { user } = renderChangePasswordPage();
    await fillAndSubmit(user, 'short1', 'short1');

    expect(
      await screen.findByText('新しいパスワードは8文字以上で、英字（a〜z）と数字（0〜9）をまぜて設定してください')
    ).toBeInTheDocument();
  });

  test('確認用パスワードが一致しない場合バリデーションエラーが表示される', async () => {
    const { user } = renderChangePasswordPage();
    await fillAndSubmit(user, 'abcd1234', 'abcd9999');

    expect(await screen.findByText('上で入力した新しいパスワードと同じ内容を入力してください')).toBeInTheDocument();
  });

  test('変更に成功すると成功メッセージが表示され、一定時間後にダッシュボードへ遷移する', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(http.post('/api/auth/password/change', () => HttpResponse.json({ message: 'ok' })));

    try {
      const { user } = renderChangePasswordPage();
      await fillAndSubmit(user, 'abcd1234', 'abcd1234');

      expect(await screen.findByText('✅ パスワードを変更しました')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(2000);

      await waitFor(() => expect(screen.getByText('ダッシュボード画面')).toBeInTheDocument());
    } finally {
      vi.useRealTimers();
    }
  });

  test('変更に失敗（400/401）した場合、専用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/auth/password/change', () => new HttpResponse(null, { status: 400 })));

    const { user } = renderChangePasswordPage();
    await fillAndSubmit(user, 'abcd1234', 'abcd1234');

    expect(await screen.findByText('パスワードの変更に失敗しました')).toBeInTheDocument();
  });

  test('サーバーエラー（500）の場合、汎用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/auth/password/change', () => new HttpResponse(null, { status: 500 })));

    const { user } = renderChangePasswordPage();
    await fillAndSubmit(user, 'abcd1234', 'abcd1234');

    expect(await screen.findByText('しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });
});
