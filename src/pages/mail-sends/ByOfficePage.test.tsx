import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import { officeA, officeB, userTanaka, userYamada, mailSendsByOffice, mailSendPending } from '@/test/fixtures';
import { ByOfficePage } from './ByOfficePage';

const renderByOffice = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/mail-sends/by-office']}>
        <Routes>
          <Route path="/mail-sends/by-office" element={<ByOfficePage />} />
          <Route path="/mail-sends/new" element={<p>送付物登録画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('ByOfficePage（送付先別一覧）', () => {
  test('事業所ごとに送付物がグループ化され、利用者名・送付月・送付種別・ステータスが表示される', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    renderByOffice();

    expect(await screen.findByText(`🏢 ${officeA.name}`)).toBeInTheDocument();
    expect(screen.getByText(`🏢 ${officeB.name}`)).toBeInTheDocument();
    expect(screen.getAllByText(userTanaka.name).length).toBeGreaterThan(0);
    expect(screen.getByText(userYamada.name)).toBeInTheDocument();
    expect(screen.getAllByText('計画作成')).toHaveLength(2);
    expect(screen.getByText('モニタリング')).toBeInTheDocument();
    expect(screen.getByText('⏳ 送付待ち')).toBeInTheDocument();
    expect(screen.getByText('✅ 送付済み')).toBeInTheDocument();
  });

  test('期限超過の送付物には「遅れ」バッジが表示される', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    renderByOffice();

    expect(await screen.findByText('🔴 遅れ')).toBeInTheDocument();
  });

  test('ステータスを変更すると絞り込み条件付きでデータが再取得される', async () => {
    let requestedStatus: string | null = null;
    server.use(
      http.get('/api/mail-sends/by-office', ({ request }) => {
        requestedStatus = new URL(request.url).searchParams.get('status');
        return HttpResponse.json(mailSendsByOffice);
      })
    );

    const { user } = renderByOffice();
    await screen.findByText(`🏢 ${officeA.name}`);

    await user.selectOptions(screen.getByLabelText('ステータス:'), 'PENDING');

    await waitFor(() => expect(requestedStatus).toBe('PENDING'));
  });

  test('送付済みの項目にはチェックボックスが表示されない', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    renderByOffice();

    const sentItem = await screen.findByText(userYamada.name).then(el => el.closest('li'));
    expect(within(sentItem!).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  test('送付待ちの項目を選択すると「送付済みにする」ボタンが有効になる', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();

    const checkbox = await screen.findByRole('checkbox', { name: '田中 太郎 2026年6月 を選択' });
    const submitButton = screen.getByRole('button', { name: /送付済みにする/ });
    expect(submitButton).toBeDisabled();

    await user.click(checkbox);

    expect(screen.getByRole('button', { name: '✅ 選択した 1件を送付済みにする' })).toBeEnabled();
  });

  test('「全て選択」をクリックすると送付待ち全件が選択され、再度クリックで解除される', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();
    await screen.findByText(`🏢 ${officeA.name}`);

    await user.click(screen.getByRole('button', { name: '☑️ 全て選択' }));
    expect(screen.getByRole('button', { name: '✅ 選択した 2件を送付済みにする' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '☑️ 全て選択解除' }));
    expect(screen.getByRole('button', { name: /送付済みにする/ })).toBeDisabled();
  });

  test('選択した項目を送付済みにするとモーダルが表示され、確定すると一括送付APIが呼ばれる', async () => {
    let batchCalled = false;
    server.use(
      http.get('/api/mail-sends/by-office', () => HttpResponse.json([{ office: officeA, mailSends: [mailSendPending] }])),
      http.post('/api/mail-send-batches', () => {
        batchCalled = true;
        return HttpResponse.json({ batchId: 9999, sentAt: '2026-06-08T00:00:00Z', updatedCount: 1 });
      })
    );

    const { user } = renderByOffice();

    const checkbox = await screen.findByRole('checkbox', { name: '田中 太郎 2026年6月 を選択' });
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: '✅ 選択した 1件を送付済みにする' }));

    expect(await screen.findByText('選択した項目を送付済みにする')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '送付済みにする' }));

    await waitFor(() => expect(batchCalled).toBe(true));
  });

  test('選択中にステータスを変更すると選択が解除され、その旨が通知される', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();

    const checkbox = await screen.findByRole('checkbox', { name: '田中 太郎 2026年6月 を選択' });
    await user.click(checkbox);
    expect(screen.getByRole('button', { name: /送付済みにする/ })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('ステータス:'), 'PENDING');

    expect(await screen.findByText('表示を切り替えたため、選択は解除されました')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /送付済みにする/ })).toBeDisabled();
  });

  test('選択がない状態でステータスを変更しても、選択解除の通知は表示されない', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();
    await screen.findByText(`🏢 ${officeA.name}`);

    await user.selectOptions(screen.getByLabelText('ステータス:'), 'PENDING');

    expect(screen.queryByText('表示を切り替えたため、選択は解除されました')).not.toBeInTheDocument();
  });

  test('選択中に通知が表示された後、選択なしで再度フィルタを変更すると通知が消える', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();

    const checkbox = await screen.findByRole('checkbox', { name: '田中 太郎 2026年6月 を選択' });
    await user.click(checkbox);
    await user.selectOptions(screen.getByLabelText('ステータス:'), 'PENDING');
    expect(await screen.findByText('表示を切り替えたため、選択は解除されました')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('ステータス:'), 'SENT');

    expect(screen.queryByText('表示を切り替えたため、選択は解除されました')).not.toBeInTheDocument();
  });

  test('データ取得に失敗した場合、再読み込みボタンで再取得できる', async () => {
    let callCount = 0;
    server.use(http.get('/api/mail-sends/by-office', () => {
      callCount++;
      if (callCount === 1) return HttpResponse.json({ message: 'error' }, { status: 500 });
      return HttpResponse.json(mailSendsByOffice);
    }));

    const { user } = renderByOffice();

    expect(await screen.findByText('データの取得に失敗しました')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '再読み込み' }));

    await waitFor(() => expect(screen.queryByText('データの取得に失敗しました')).not.toBeInTheDocument());
    expect(await screen.findByText(`🏢 ${officeA.name}`)).toBeInTheDocument();
    expect(callCount).toBe(2);
  });

  test('「送付物を新規登録」をクリックすると送付物作成画面へ遷移する', async () => {
    server.use(http.get('/api/mail-sends/by-office', () => HttpResponse.json(mailSendsByOffice)));

    const { user } = renderByOffice();

    await user.click(await screen.findByRole('button', { name: '➕ 送付物を新規登録' }));

    await waitFor(() => expect(screen.getByText('送付物登録画面')).toBeInTheDocument());
  });
});
