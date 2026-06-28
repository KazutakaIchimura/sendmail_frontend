import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import { userTanakaWithOffices, inactiveUser, officeA, officeB, officeD, mailSendPending } from '@/test/fixtures';
import { UserDetailPage } from './UserDetailPage';

const renderUserDetail = (id = userTanakaWithOffices.id) => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/users/${id}`]}>
        <Routes>
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/:id/edit" element={<p>利用者編集画面</p>} />
          <Route path="/users" element={<p>利用者一覧画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('UserDetailPage', () => {
  test('基本情報（氏名・ふりがな・生年月日・備考）が表示される', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    renderUserDetail();

    expect(await screen.findByText('【基本情報】')).toBeInTheDocument();
    expect(screen.getByText(userTanakaWithOffices.nameKana!)).toBeInTheDocument();
    expect(screen.getByText('1985年4月1日')).toBeInTheDocument();
  });

  test('紐付き事業所一覧が表示される', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    renderUserDetail();

    expect(await screen.findByText('【紐付き事業所】')).toBeInTheDocument();
    expect(screen.getByText(`🏢 ${officeA.name}`)).toBeInTheDocument();
    expect(screen.getByText(`🏢 ${officeB.name}`)).toBeInTheDocument();
  });

  test('有効な利用者には「編集」ボタンが表示される', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    renderUserDetail();

    expect(await screen.findByRole('button', { name: '編集' })).toBeInTheDocument();
  });

  test('無効な利用者には「編集」ボタンが表示されない', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json({ ...inactiveUser, offices: [] })),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    renderUserDetail(inactiveUser.id);

    await waitFor(() => expect(screen.getByText('【基本情報】')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
  });

  test('「紐付け解除」をクリックすると確認モーダルが表示され、確定すると解除APIが呼ばれる', async () => {
    let removeCalled = false;
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([])),
      http.delete('/api/users/:userId/offices/:officeId', () => {
        removeCalled = true;
        return HttpResponse.json({});
      })
    );

    const { user } = renderUserDetail();

    expect(await screen.findByText('【紐付き事業所】')).toBeInTheDocument();
    const officeItem = screen.getByText(`🏢 ${officeA.name}`).closest('li');
    await user.click(within(officeItem!).getByRole('button', { name: '紐付け解除' }));

    expect(await screen.findByText('紐付けを解除しますか？')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '解除する' }));

    await waitFor(() => expect(removeCalled).toBe(true));
  });

  test('「事業所を追加」から未紐付けの事業所を選んで追加できる（紐付け済みの事業所は選択肢に出ない）', async () => {
    let addRequestBody: unknown = null;
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([])),
      http.get('/api/offices', () => HttpResponse.json([officeA, officeB, officeD])),
      http.post('/api/users/:id/offices', async ({ request }) => {
        addRequestBody = await request.json();
        return HttpResponse.json({});
      })
    );

    const { user } = renderUserDetail();

    await user.click(await screen.findByRole('button', { name: '＋ 事業所を追加' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).queryByText(officeA.name)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(officeB.name)).not.toBeInTheDocument();

    await user.click(within(dialog).getByText(officeD.name));
    await user.click(within(dialog).getByRole('button', { name: '追加する' }));

    await waitFor(() => expect(addRequestBody).toEqual({ officeId: officeD.id }));
  });

  test('最近の送付履歴が表示される', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([mailSendPending]))
    );

    renderUserDetail();

    expect(await screen.findByText('【最近の送付履歴】')).toBeInTheDocument();
    expect(screen.getByText(mailSendPending.officeName)).toBeInTheDocument();
    expect(screen.getByText('計画作成')).toBeInTheDocument();
  });

  test('送付履歴が0件の場合「送付履歴がありません」と表示される', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    renderUserDetail();

    expect(await screen.findByText('送付履歴がありません')).toBeInTheDocument();
  });

  test('「← 戻る」をクリックすると利用者一覧へ遷移する', async () => {
    server.use(
      http.get('/api/users/:id', () => HttpResponse.json(userTanakaWithOffices)),
      http.get('/api/mail-sends', () => HttpResponse.json([]))
    );

    const { user } = renderUserDetail();
    await screen.findByText('【基本情報】');
    await user.click(screen.getByRole('button', { name: '← 戻る' }));

    await waitFor(() => expect(screen.getByText('利用者一覧画面')).toBeInTheDocument());
  });
});
