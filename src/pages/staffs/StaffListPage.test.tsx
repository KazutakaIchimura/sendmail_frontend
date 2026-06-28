import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import { adminStaff, staffMember, inactiveStaff } from '@/test/fixtures';
import { StaffListPage } from './StaffListPage';

const renderStaffList = (loginAs = adminStaff) => {
  server.use(http.get('/api/auth/me', () => HttpResponse.json(loginAs)));

  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/staffs']}>
        <AuthProvider>
          <Routes>
            <Route path="/staffs" element={<StaffListPage />} />
            <Route path="/staffs/new" element={<p>スタッフ登録画面</p>} />
            <Route path="/staffs/:id/edit" element={<p>スタッフ編集画面</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('StaffListPage', () => {
  test('スタッフ一覧（氏名・メール・権限）が表示される', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    renderStaffList();

    expect(await screen.findByText(adminStaff.name)).toBeInTheDocument();
    expect(screen.getByText(adminStaff.email)).toBeInTheDocument();
    expect(screen.getByText('🔑 ADMIN')).toBeInTheDocument();
    expect(screen.getByText(staffMember.name)).toBeInTheDocument();
    expect(screen.getByText('👤 STAFF')).toBeInTheDocument();
  });

  test('無効なスタッフは「※無効」と表示され「有効に戻す」ボタンが表示される', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, inactiveStaff])));

    renderStaffList();

    expect(await screen.findByText(inactiveStaff.name)).toBeInTheDocument();
    expect(screen.getByText('※無効')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '有効に戻す' })).toBeInTheDocument();
  });

  test('自分自身には「無効にする」ボタンが表示されない（自己無効化禁止）', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    renderStaffList(adminStaff);

    expect(await screen.findByText(adminStaff.name)).toBeInTheDocument();
    expect(screen.getByText('（自分）')).toBeInTheDocument();

    const adminItem = screen.getByText(adminStaff.name).closest('li');
    expect(adminItem).not.toBeNull();
    expect(adminItem && Array.from(adminItem.querySelectorAll('button')).some(b => b.textContent === '無効にする')).toBe(false);
  });

  test('ADMIN が最後の1人の場合「無効にする」ボタンが表示されない', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    renderStaffList(staffMember);

    expect(await screen.findByText(adminStaff.name)).toBeInTheDocument();
    const adminItem = screen.getByText(adminStaff.name).closest('li');
    expect(adminItem && Array.from(adminItem.querySelectorAll('button')).some(b => b.textContent === '無効にする')).toBe(false);
  });

  test('「無効にする」をクリックすると確認モーダルが表示され、確定すると無効化APIが呼ばれる', async () => {
    let disableCalled = false;
    server.use(
      http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])),
      http.delete('/api/staffs/:id', () => {
        disableCalled = true;
        return HttpResponse.json({});
      })
    );

    const { user } = renderStaffList(adminStaff);

    expect(await screen.findByText(staffMember.name)).toBeInTheDocument();
    const staffItem = screen.getByText(staffMember.name).closest('li');
    expect(staffItem).not.toBeNull();

    await user.click(within(staffItem!).getByRole('button', { name: '無効にする' }));

    expect(await screen.findByText('スタッフを無効にしますか？')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '無効にする' }));

    await waitFor(() => expect(disableCalled).toBe(true));
  });

  test('「有効に戻す」をクリックすると有効化APIが呼ばれる', async () => {
    let activateCalled = false;
    server.use(
      http.get('/api/staffs', () => HttpResponse.json([adminStaff, inactiveStaff])),
      http.patch('/api/staffs/:id/activate', () => {
        activateCalled = true;
        return HttpResponse.json({ ...inactiveStaff, isActive: true });
      })
    );

    const { user } = renderStaffList(adminStaff);

    await user.click(await screen.findByRole('button', { name: '有効に戻す' }));

    await waitFor(() => expect(activateCalled).toBe(true));
  });

  test('「新規登録」ボタンをクリックすると登録画面へ遷移する', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff])));

    const { user } = renderStaffList();

    await user.click(await screen.findByRole('button', { name: '➕ 新規登録' }));

    await waitFor(() => expect(screen.getByText('スタッフ登録画面')).toBeInTheDocument());
  });

  test('データ取得に失敗した場合エラーメッセージと再読み込みボタンが表示される', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json({ message: 'error' }, { status: 500 })));

    renderStaffList();

    expect(await screen.findByRole('alert')).toHaveTextContent('データの取得に失敗しました');
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });

  test('「編集」ボタンをクリックすると編集画面へ遷移する', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    const { user } = renderStaffList(adminStaff);

    expect(await screen.findByText(staffMember.name)).toBeInTheDocument();
    const staffItem = screen.getByText(staffMember.name).closest('li');
    await user.click(within(staffItem!).getByRole('button', { name: '編集' }));

    await waitFor(() => expect(screen.getByText('スタッフ編集画面')).toBeInTheDocument());
  });
});
