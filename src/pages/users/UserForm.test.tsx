import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { userTanaka, userTanakaWithOffices } from '@/test/fixtures';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserForm } from './UserForm';

const renderUserForm = (initialPath: string) => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <AccessibilityProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />
              <Route path="/users/:id" element={<p>利用者詳細画面</p>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('UserForm（新規登録）', () => {
  test('氏名が未入力の場合バリデーションエラーが表示される', async () => {
    const { user } = renderUserForm('/users/new');

    await user.click(await screen.findByRole('button', { name: '登録する' }));

    expect(await screen.findByText('氏名を入力してください')).toBeInTheDocument();
  });

  test('登録に成功すると詳細画面へ遷移する', async () => {
    server.use(http.post('/api/users', () => HttpResponse.json(userTanaka)));

    const { user } = renderUserForm('/users/new');

    await user.type(await screen.findByLabelText(/^氏名/), '田中 太郎');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText('利用者詳細画面')).toBeInTheDocument());
  });

  test('登録に失敗するとエラーメッセージが表示される', async () => {
    server.use(http.post('/api/users', () => new HttpResponse(null, { status: 500 })));

    const { user } = renderUserForm('/users/new');
    await user.type(await screen.findByLabelText(/^氏名/), '田中 太郎');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByText('しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });

  test('「キャンセル」をクリックすると前の画面に戻る', async () => {
    const client = createTestQueryClient();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <AccessibilityProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/users', '/users/new']} initialIndex={1}>
              <Routes>
                <Route path="/users/new" element={<UserForm />} />
                <Route path="/users" element={<p>利用者一覧画面</p>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    );

    await user.click(await screen.findByRole('button', { name: 'キャンセル' }));
    await waitFor(() => expect(screen.getByText('利用者一覧画面')).toBeInTheDocument());
  });
});

describe('UserForm（編集）', () => {
  test('編集時は既存の利用者情報がフォームに反映される', async () => {
    server.use(http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)));

    renderUserForm(`/users/${userTanakaWithOffices.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^氏名/)).toHaveValue(userTanakaWithOffices.name));
    expect(screen.getByLabelText(/^ふりがな/)).toHaveValue(userTanakaWithOffices.nameKana);
  });

  test('編集に成功すると詳細画面へ遷移する', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.patch('/api/users/:id', () => HttpResponse.json(userTanaka))
    );

    const { user } = renderUserForm(`/users/${userTanakaWithOffices.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^氏名/)).toHaveValue(userTanakaWithOffices.name));
    await user.click(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(screen.getByText('利用者詳細画面')).toBeInTheDocument());
  });
});
