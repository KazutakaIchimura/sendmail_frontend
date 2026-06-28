import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient, within } from '@/test/test-utils';
import { server } from '@/test/server';
import type { MailSend } from '@/types/mailSend';
import { officeA, officeB, userTanaka, userYamada, mailSendPending, mailSendOverdue, mailSendSent } from '@/test/fixtures';
import { HistoryPage } from './HistoryPage';

const renderHistory = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/mail-sends/history']}>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('HistoryPage（送付履歴）', () => {
  test('送付履歴が日付ごとにグループ化され、事業所名・氏名・種別・送付月・ステータスが表示される', async () => {
    server.use(http.get('/api/mail-sends', () => HttpResponse.json([mailSendPending, mailSendOverdue, mailSendSent])));

    renderHistory();

    expect(await screen.findByText('2026/06/01')).toBeInTheDocument();
    expect(screen.getByText('2026/04/01')).toBeInTheDocument();
    expect(screen.getByText('2026/06/02')).toBeInTheDocument();
    expect(screen.getAllByText(userTanaka.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(userYamada.name).length).toBeGreaterThan(0);
    expect(screen.getByText('モニタリング')).toBeInTheDocument();
    expect(screen.getByText('🔴 遅れ')).toBeInTheDocument();
    expect(screen.getByText('✅ 送付済み')).toBeInTheDocument();
  });

  test('事業所・利用者を選択すると絞り込み条件付きでデータが再取得される', async () => {
    let lastParams: URLSearchParams | null = null;
    server.use(
      http.get('/api/offices', () => HttpResponse.json([officeA, officeB])),
      http.get('/api/users', () => HttpResponse.json([userTanaka, userYamada])),
      http.get('/api/mail-sends', ({ request }) => {
        lastParams = new URL(request.url).searchParams;
        return HttpResponse.json([mailSendPending]);
      })
    );

    const { user } = renderHistory();
    await waitFor(() => expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('事業所'), String(officeA.id));
    await waitFor(() => expect(lastParams?.get('officeId')).toBe(String(officeA.id)));

    await user.selectOptions(screen.getByLabelText('利用者'), String(userTanaka.id));
    await waitFor(() => expect(lastParams?.get('userId')).toBe(String(userTanaka.id)));
  });

  test('送付履歴の取得に失敗した場合はエラーメッセージと再読み込みボタンが表示される', async () => {
    server.use(http.get('/api/mail-sends', () => HttpResponse.json({ message: 'error' }, { status: 500 })));

    renderHistory();

    expect(await screen.findByRole('alert')).toHaveTextContent('データの取得に失敗しました');
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
    expect(screen.queryByText('該当する送付履歴はありません')).not.toBeInTheDocument();
  });

  test('再読み込みボタンをクリックすると再取得され、成功すれば一覧が表示される', async () => {
    let callCount = 0;
    server.use(http.get('/api/mail-sends', () => {
      callCount++;
      if (callCount === 1) {
        return HttpResponse.json({ message: 'error' }, { status: 500 });
      }
      return HttpResponse.json([mailSendPending]);
    }));

    const { user } = renderHistory();
    await user.click(await screen.findByRole('button', { name: '再読み込み' }));

    await waitFor(() => expect(callCount).toBe(2));
    expect(await screen.findByText('2026/06/01')).toBeInTheDocument();
  });

  test('送付履歴が0件の場合「該当する送付履歴はありません」と表示される', async () => {
    server.use(http.get('/api/mail-sends', () => HttpResponse.json([])));

    renderHistory();

    expect(await screen.findByText('該当する送付履歴はありません')).toBeInTheDocument();
  });

  test('開始年を変更するとAPIのdateFromパラメータに反映される', async () => {
    let lastParams: URLSearchParams | null = null;
    server.use(
      http.get('/api/mail-sends', ({ request }) => {
        lastParams = new URL(request.url).searchParams;
        return HttpResponse.json([]);
      })
    );

    const { user } = renderHistory();
    await waitFor(() => expect(lastParams).not.toBeNull());

    const prevYear = String(new Date().getFullYear() - 1);
    await user.selectOptions(screen.getByLabelText('期間'), prevYear);

    await waitFor(() => expect(lastParams?.get('dateFrom')).toMatch(new RegExp(`^${prevYear}-`)));
  });

  test('同じbatchIdの送付物は同じカードにまとめて表示される', async () => {
    const updatedAt = '2026-06-10T00:00:00Z';
    const batchedA: MailSend = { ...mailSendPending, id: 2001, status: 'SENT', batchId: 9000, userName: '田中 太郎', updatedAt };
    const batchedB: MailSend = { ...mailSendSent, id: 2002, batchId: 9000, userName: '山田 花子', updatedAt };
    const solo: MailSend = { ...mailSendPending, id: 2003, batchId: null, userName: '佐藤 次郎', updatedAt };

    server.use(
      http.get('/api/mail-sends', () => HttpResponse.json([batchedA, batchedB, solo])),
      // フィルタ用セレクトのoptionと区別するため利用者・事業所は空にする
      http.get('/api/users', () => HttpResponse.json([])),
      http.get('/api/offices', () => HttpResponse.json([]))
    );

    renderHistory();

    await screen.findByText('田中 太郎');

    // バッチ9000の2件は同じulに含まれ、ソロは別のulに入る
    const batchedList = screen.getByText('田中 太郎').closest('ul');
    expect(within(batchedList!).getByText('山田 花子')).toBeInTheDocument();
    expect(within(batchedList!).queryByText('佐藤 次郎')).not.toBeInTheDocument();
  });

});
