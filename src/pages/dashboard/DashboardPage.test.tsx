import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithProviders, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { dashboardData, dashboardDataNoOverdue } from '@/test/fixtures';
import { DashboardPage } from './DashboardPage';

const renderWithRoutes = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mail-sends/by-office" element={<p>送付先別一覧画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('DashboardPage', () => {
  test('読み込み中はローディング表示になる', () => {
    server.use(http.get('/api/dashboard', async () => {
      await new Promise(r => setTimeout(r, 50));
      return HttpResponse.json(dashboardData);
    }));

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  test('取得に失敗した場合エラーメッセージと再読み込みボタンが表示される', async () => {
    server.use(http.get('/api/dashboard', () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('データの取得に失敗しました');
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });

  test('再読み込みボタンをクリックすると再取得され、成功すればダッシュボードが表示される', async () => {
    let callCount = 0;
    server.use(http.get('/api/dashboard', () => {
      callCount++;
      if (callCount === 1) {
        return new HttpResponse(null, { status: 500 });
      }
      return HttpResponse.json(dashboardData);
    }));

    renderWithProviders(<DashboardPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: '再読み込み' }));

    await waitFor(() => expect(callCount).toBe(2));
    expect(await screen.findByText('2026年6月')).toBeInTheDocument();
  });

  test('当月年月とサマリーカード（送付待ち・送付済み・期限切れ件数）が表示される', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('2026年6月')).toBeInTheDocument();
    expect(screen.getByLabelText('2件')).toBeInTheDocument();
    expect(screen.getAllByLabelText('1件')).toHaveLength(2);
    expect(screen.getByText('送付待ち')).toBeInTheDocument();
    expect(screen.getByText('送付済み(今月)')).toBeInTheDocument();
    expect(screen.getByText('期限切れ')).toBeInTheDocument();
  });

  test('期限切れの月遅れがある場合、月遅れアラートが表示される', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    renderWithProviders(<DashboardPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('月遅れの送付待ちがあります');
    expect(alert).toHaveTextContent('2026年4月分 1件');
  });

  test('月遅れがない場合、月遅れアラートは表示されない', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardDataNoOverdue)));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('2026年6月')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('最近の送付履歴一覧が表示される', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: /最近の送付履歴/ })).toBeInTheDocument();
    expect(screen.getByText(dashboardData.recentHistory[0].officeName)).toBeInTheDocument();
    expect(screen.getByText(dashboardData.recentHistory[0].userName)).toBeInTheDocument();
    expect(screen.getByText('計画作成')).toBeInTheDocument();
    expect(screen.getByText('モニタリング')).toBeInTheDocument();
  });

  test('「送付待ち」カードの「一覧を見る」をクリックすると送付先別一覧へ遷移する', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    const { user } = renderWithRoutes();

    await screen.findByText('2026年6月');
    await user.click(screen.getByRole('button', { name: '送付待ちの一覧を見る' }));

    await waitFor(() => expect(screen.getByText('送付先別一覧画面')).toBeInTheDocument());
  });

  test('「送付物を新規登録」ボタンと「送付先別一覧」ボタンが表示される', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('button', { name: '➕ 送付物を新規登録' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '📮 送付先別一覧' })).toBeInTheDocument();
  });

  test('「履歴を全て見る」ボタンが表示される', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json(dashboardData)));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('button', { name: '履歴を全て見る →' })).toBeInTheDocument();
  });
});
