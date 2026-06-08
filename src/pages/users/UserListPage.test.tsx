import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import { userTanaka, userYamada, inactiveUser } from '@/test/fixtures';
import { UserListPage } from './UserListPage';

const renderUserList = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/new" element={<p>利用者登録画面</p>} />
          <Route path="/users/:id" element={<p>利用者詳細画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('UserListPage', () => {
  test('利用者一覧（氏名・ふりがな）が表示される', async () => {
    server.use(http.get('/api/users', () => HttpResponse.json([userTanaka, userYamada])));

    renderUserList();

    expect(await screen.findByText(userTanaka.name)).toBeInTheDocument();
    expect(screen.getByText(userTanaka.nameKana!)).toBeInTheDocument();
    expect(screen.getByText(userYamada.name)).toBeInTheDocument();
  });

  test('検索ボックスに入力すると氏名・ふりがなで絞り込まれる', async () => {
    server.use(http.get('/api/users', () => HttpResponse.json([userTanaka, userYamada])));

    const { user } = renderUserList();

    expect(await screen.findByText(userTanaka.name)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('氏名・ふりがなで検索...'), '山田');

    await waitFor(() => expect(screen.queryByText(userTanaka.name)).not.toBeInTheDocument());
    expect(screen.getByText(userYamada.name)).toBeInTheDocument();
  });

  test('無効な利用者は「※無効」と表示され「有効に戻す」ボタンが表示される', async () => {
    server.use(http.get('/api/users', () => HttpResponse.json([userTanaka, inactiveUser])));

    renderUserList();

    expect(await screen.findByText(inactiveUser.name)).toBeInTheDocument();
    expect(screen.getByText('※無効')).toBeInTheDocument();
    const inactiveItem = screen.getByText(inactiveUser.name).closest('li');
    expect(inactiveItem).not.toBeNull();
    expect(within(inactiveItem!).getByRole('button', { name: '有効に戻す' })).toBeInTheDocument();
  });

  test('「無効にする」をクリックすると確認モーダルが表示され、確定すると無効化APIが呼ばれる', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/users', () => HttpResponse.json([userTanaka, userYamada])),
      http.delete('/api/users/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({});
      })
    );

    const { user } = renderUserList();

    expect(await screen.findByText(userTanaka.name)).toBeInTheDocument();
    const item = screen.getByText(userTanaka.name).closest('li');
    await user.click(within(item!).getByRole('button', { name: '無効にする' }));

    expect(await screen.findByText('利用者を無効にしますか？')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '無効にする' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  test('「詳細を見る」をクリックすると詳細画面へ遷移する', async () => {
    server.use(http.get('/api/users', () => HttpResponse.json([userTanaka])));

    const { user } = renderUserList();

    const item = await screen.findByText(userTanaka.name);
    await user.click(within(item.closest('li')!).getByRole('button', { name: '詳細を見る' }));

    await waitFor(() => expect(screen.getByText('利用者詳細画面')).toBeInTheDocument());
  });

  test('「新規登録」をクリックすると登録画面へ遷移する', async () => {
    server.use(http.get('/api/users', () => HttpResponse.json([userTanaka])));

    const { user } = renderUserList();

    await user.click(await screen.findByRole('button', { name: '➕ 新規登録' }));

    await waitFor(() => expect(screen.getByText('利用者登録画面')).toBeInTheDocument());
  });
});
