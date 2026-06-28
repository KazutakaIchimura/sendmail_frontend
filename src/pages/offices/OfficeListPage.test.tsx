import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import { officeA, officeB, inactiveOffice } from '@/test/fixtures';
import { OfficeListPage } from './OfficeListPage';

const renderOfficeList = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/offices']}>
        <Routes>
          <Route path="/offices" element={<OfficeListPage />} />
          <Route path="/offices/new" element={<p>事業所登録画面</p>} />
          <Route path="/offices/:id/edit" element={<p>事業所編集画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('OfficeListPage', () => {
  test('事業所一覧（事業所名・住所）が表示される', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA, officeB])));

    renderOfficeList();

    expect(await screen.findByText(officeA.name)).toBeInTheDocument();
    expect(screen.getByText(`〒${officeA.postalCode} ${officeA.address}`)).toBeInTheDocument();
    expect(screen.getByText(officeB.name)).toBeInTheDocument();
  });

  test('検索ボックスに入力すると事業所名で絞り込まれる', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA, officeB])));

    const { user } = renderOfficeList();

    expect(await screen.findByText(officeA.name)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('事業所名で検索...'), '就労支援');

    await waitFor(() => expect(screen.queryByText(officeA.name)).not.toBeInTheDocument());
    expect(screen.getByText(officeB.name)).toBeInTheDocument();
  });

  test('無効な事業所は「※無効」と表示され「有効に戻す」ボタンが表示される', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA, inactiveOffice])));

    renderOfficeList();

    expect(await screen.findByText(inactiveOffice.name)).toBeInTheDocument();
    expect(screen.getByText('※無効')).toBeInTheDocument();
    const item = screen.getByText(inactiveOffice.name).closest('li');
    expect(within(item!).getByRole('button', { name: '有効に戻す' })).toBeInTheDocument();
  });

  test('無効な事業所には「編集」ボタンが表示されない', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA, inactiveOffice])));

    renderOfficeList();

    const item = await screen.findByText(inactiveOffice.name).then(el => el.closest('li'));
    expect(item).not.toBeNull();
    expect(within(item!).queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
  });

  test('「無効にする」をクリックすると確認モーダルが表示され、確定すると無効化APIが呼ばれる', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/offices', () => HttpResponse.json([officeA, officeB])),
      http.delete('/api/offices/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({});
      })
    );

    const { user } = renderOfficeList();

    const item = await screen.findByText(officeA.name).then(el => el.closest('li'));
    await user.click(within(item!).getByRole('button', { name: '無効にする' }));

    expect(await screen.findByText('事業所を無効にしますか？')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '無効にする' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  test('「有効に戻す」をクリックすると有効化APIが呼ばれる', async () => {
    let activateCalled = false;
    server.use(
      http.get('/api/offices', () => HttpResponse.json([inactiveOffice])),
      http.patch('/api/offices/:id/activate', () => {
        activateCalled = true;
        return HttpResponse.json({ ...inactiveOffice, isActive: true });
      })
    );

    const { user } = renderOfficeList();
    await user.click(await screen.findByRole('button', { name: '有効に戻す' }));

    await waitFor(() => expect(activateCalled).toBe(true));
  });

  test('「新規登録」をクリックすると登録画面へ遷移する', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA])));

    const { user } = renderOfficeList();
    await user.click(await screen.findByRole('button', { name: '➕ 新規登録' }));

    await waitFor(() => expect(screen.getByText('事業所登録画面')).toBeInTheDocument());
  });

  test('「編集」をクリックすると編集画面へ遷移する', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([officeA])));

    const { user } = renderOfficeList();
    const item = await screen.findByText(officeA.name).then(el => el.closest('li'));
    await user.click(within(item!).getByRole('button', { name: '編集' }));

    await waitFor(() => expect(screen.getByText('事業所編集画面')).toBeInTheDocument());
  });

  test('0件の場合「該当する事業所がありません」と表示される', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json([])));

    renderOfficeList();

    expect(await screen.findByText('該当する事業所がありません')).toBeInTheDocument();
  });

  test('データ取得に失敗した場合エラーメッセージと再読み込みボタンが表示される', async () => {
    server.use(http.get('/api/offices', () => HttpResponse.json({ message: 'error' }, { status: 500 })));

    renderOfficeList();

    expect(await screen.findByRole('alert')).toHaveTextContent('データの取得に失敗しました');
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });
});
