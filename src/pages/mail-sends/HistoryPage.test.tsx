import { describe, expect, test, vi } from 'vitest';
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

  test('「CSV出力」をクリックするとCSVファイルがダウンロードされる', async () => {
    server.use(
      http.get('/api/mail-sends/export', () =>
        new HttpResponse(new Blob(['id,user\n']), { headers: { 'Content-Type': 'text/csv' } })
      )
    );

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user } = renderHistory();
    await user.click(await screen.findByRole('button', { name: 'CSV出力' }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    expect(clickSpy).toHaveBeenCalled();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url'));

    clickSpy.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});
