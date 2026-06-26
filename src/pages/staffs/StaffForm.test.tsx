import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { adminStaff, staffMember } from '@/test/fixtures';
import { StaffForm } from './StaffForm';
import { StaffListPage } from './StaffListPage';

const renderStaffForm = (initialPath: string) => {
  server.use(http.get('/api/auth/me', () => HttpResponse.json(adminStaff)));

  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/staffs/new" element={<StaffForm />} />
            <Route path="/staffs/:id/edit" element={<StaffForm />} />
            <Route path="/staffs" element={<p>スタッフ一覧画面</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('StaffForm（新規登録）', () => {
  test('必須項目（氏名・メールアドレス）が未入力の場合バリデーションエラーが表示される', async () => {
    const { user } = renderStaffForm('/staffs/new');

    await user.click(await screen.findByRole('button', { name: '登録する' }));

    expect(await screen.findByText('氏名を入力してください')).toBeInTheDocument();
    expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
  });

  test('パスワードが条件を満たさない場合バリデーションエラーが表示される', async () => {
    const { user } = renderStaffForm('/staffs/new');

    await user.type(await screen.findByLabelText(/^氏名/), '佐藤 次郎');
    await user.type(screen.getByLabelText(/^メールアドレス/), 'sato@example.com');
    await user.type(screen.getByLabelText(/^パスワード/), 'short');
    await user.selectOptions(screen.getByLabelText(/^権限/), 'STAFF');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(
      await screen.findByText('パスワードは8文字以上で、英字（a〜z）と数字（0〜9）をまぜて設定してください')
    ).toBeInTheDocument();
  });

  test('登録に成功すると一覧画面へ遷移する', async () => {
    server.use(http.post('/api/staffs', () => HttpResponse.json({ ...staffMember, id: 99 })));

    const { user } = renderStaffForm('/staffs/new');

    await user.type(await screen.findByLabelText(/^氏名/), '佐藤 次郎');
    await user.type(screen.getByLabelText(/^メールアドレス/), 'sato@example.com');
    await user.type(screen.getByLabelText(/^パスワード/), 'abcd1234');
    await user.selectOptions(screen.getByLabelText(/^権限/), 'STAFF');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText('スタッフ一覧画面')).toBeInTheDocument());
  });

  test('メールアドレスが重複している場合（409）専用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/staffs', () => new HttpResponse(null, { status: 409 })));

    const { user } = renderStaffForm('/staffs/new');

    await user.type(await screen.findByLabelText(/^氏名/), '佐藤 次郎');
    await user.type(screen.getByLabelText(/^メールアドレス/), 'yamada@example.com');
    await user.type(screen.getByLabelText(/^パスワード/), 'abcd1234');
    await user.selectOptions(screen.getByLabelText(/^権限/), 'STAFF');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(
      await screen.findByText('このメールアドレスはすでに登録されています。別のアドレスをお使いください')
    ).toBeInTheDocument();
  });

  test('登録に成功して一覧画面へ遷移した直後から、新しいスタッフが（リロードなしで）表示される', async () => {
    // 遷移先を実際のStaffListPageにすることで「navigate直後はキャッシュが古いまま」という
    // 回帰を検出できるようにする。
    // 背景: StaffFormは同一queryKey['staffs']にenabled:falseのobserverを持つため、
    // invalidateQueries({ refetchType:'all' })ではisDisabled()=trueとなりGETが発火しない。
    // fetchQueryで直接フェッチすることでnavigate前にキャッシュを確実に最新化している。
    let staffs = [adminStaff, staffMember];
    const newStaff = { ...staffMember, id: 99, name: '佐藤 次郎', email: 'sato@example.com' };

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(adminStaff)),
      http.get('/api/staffs', () => HttpResponse.json(staffs)),
      http.post('/api/staffs', () => {
        staffs = [...staffs, newStaff];
        return HttpResponse.json(newStaff);
      })
    );

    const client = createTestQueryClient();
    // 一覧画面を訪れたあとに新規登録画面へ遷移した状態を再現するため、事前にキャッシュへ古いデータを入れておく
    client.setQueryData(['staffs'], [adminStaff, staffMember]);

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/staffs/new']}>
          <AuthProvider>
            <Routes>
              <Route path="/staffs/new" element={<StaffForm />} />
              <Route path="/staffs" element={<StaffListPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await user.type(await screen.findByLabelText(/^氏名/), newStaff.name);
    await user.type(screen.getByLabelText(/^メールアドレス/), newStaff.email);
    await user.type(screen.getByLabelText(/^パスワード/), 'abcd1234');
    await user.selectOptions(screen.getByLabelText(/^権限/), 'STAFF');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText(/スタッフ管理/)).toBeInTheDocument());
    expect(screen.getByText(newStaff.name)).toBeInTheDocument();
  });

  test('「キャンセル」をクリックすると一覧画面へ戻る', async () => {
    const { user } = renderStaffForm('/staffs/new');

    await user.click(await screen.findByRole('button', { name: 'キャンセル' }));

    await waitFor(() => expect(screen.getByText('スタッフ一覧画面')).toBeInTheDocument());
  });
});

describe('StaffForm（編集）', () => {
  test('編集時は既存のスタッフ情報がフォームに反映される', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    renderStaffForm(`/staffs/${staffMember.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^氏名/)).toHaveValue(staffMember.name));
    expect(screen.getByLabelText(/^メールアドレス/)).toHaveValue(staffMember.email);
    expect(screen.getByLabelText(/^権限/)).toHaveValue(staffMember.role);
  });

  test('編集時はパスワード入力欄が表示されない', async () => {
    server.use(http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])));

    renderStaffForm(`/staffs/${staffMember.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^氏名/)).toHaveValue(staffMember.name));
    expect(screen.queryByLabelText(/^パスワード/)).not.toBeInTheDocument();
  });

  test('編集に成功すると一覧画面へ遷移する', async () => {
    server.use(
      http.get('/api/staffs', () => HttpResponse.json([adminStaff, staffMember])),
      http.put('/api/staffs/:id', () => HttpResponse.json(staffMember))
    );

    const { user } = renderStaffForm(`/staffs/${staffMember.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^氏名/)).toHaveValue(staffMember.name));
    await user.click(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(screen.getByText('スタッフ一覧画面')).toBeInTheDocument());
  });
});
