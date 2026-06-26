import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
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

});
