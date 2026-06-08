import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/test/server';
import { adminStaff } from '@/test/fixtures';
import { LoginForm } from './LoginForm';

const renderLoginForm = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/password/change" element={<p>パスワード変更画面</p>} />
          <Route path="/" element={<p>ダッシュボード画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  await user.type(screen.getByLabelText('メールアドレス'), email);
  await user.type(screen.getByLabelText('パスワード'), password);
  await user.click(screen.getByRole('button', { name: /ログイン/ }));
};

describe('LoginForm', () => {
  test('メールアドレスが空の場合バリデーションエラーが表示される', async () => {
    const { user } = renderLoginForm();
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: /ログイン/ }));

    expect(await screen.findByText('メールアドレスを入力してください')).toBeInTheDocument();
  });

  test('メールアドレスの形式が不正な場合バリデーションエラーが表示される', async () => {
    const { user } = renderLoginForm();
    await user.type(screen.getByLabelText('メールアドレス'), 'invalid-email');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: /ログイン/ }));

    expect(await screen.findByText('メールアドレスは ◯◯@◯◯.◯◯ の形で入力してください')).toBeInTheDocument();
  });

  test('パスワードが空の場合バリデーションエラーが表示される', async () => {
    const { user } = renderLoginForm();
    await user.type(screen.getByLabelText('メールアドレス'), 'yamada@example.com');
    await user.click(screen.getByRole('button', { name: /ログイン/ }));

    expect(await screen.findByText('パスワードを入力してください')).toBeInTheDocument();
  });

  test('forcePasswordChange=true の場合、ログイン成功後にパスワード変更画面へ遷移する', async () => {
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ message: 'ok' })),
      http.get('/api/auth/me', () => HttpResponse.json({ ...adminStaff, forcePasswordChange: true }))
    );

    const { user } = renderLoginForm();
    await fillAndSubmit(user, 'yamada@example.com', 'password123');

    await waitFor(() => expect(screen.getByText('パスワード変更画面')).toBeInTheDocument());
  });

  test('forcePasswordChange=false の場合、ログイン成功後にダッシュボードへ遷移する', async () => {
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ message: 'ok' })),
      http.get('/api/auth/me', () => HttpResponse.json({ ...adminStaff, forcePasswordChange: false }))
    );

    const { user } = renderLoginForm();
    await fillAndSubmit(user, 'yamada@example.com', 'password123');

    await waitFor(() => expect(screen.getByText('ダッシュボード画面')).toBeInTheDocument());
  });

  test('認証エラー（401）の場合、専用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/auth/login', () => new HttpResponse(null, { status: 401 })));

    const { user } = renderLoginForm();
    await fillAndSubmit(user, 'yamada@example.com', 'wrongpassword');

    expect(await screen.findByText('メールアドレスまたはパスワードが正しくありません')).toBeInTheDocument();
  });

  test('サーバーエラー（500）の場合、汎用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/auth/login', () => new HttpResponse(null, { status: 500 })));

    const { user } = renderLoginForm();
    await fillAndSubmit(user, 'yamada@example.com', 'password123');

    expect(await screen.findByText('エラー [500]: しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });
});
