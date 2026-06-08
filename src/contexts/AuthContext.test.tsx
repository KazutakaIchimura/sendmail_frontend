import { describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { adminStaff } from '@/test/fixtures';
import { useAuth, AuthProvider } from './AuthContext';

const Probe = () => {
  const { currentStaff, isLoading, refresh } = useAuth();
  if (isLoading) return <p>loading</p>;
  return (
    <div>
      <p>{currentStaff ? currentStaff.name : '未ログイン'}</p>
      <button onClick={() => refresh()}>refresh</button>
    </div>
  );
};

const renderWithAuth = (ui: React.ReactElement) => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('AuthContext', () => {
  test('初回マウント時に GET /api/auth/me が呼ばれる', async () => {
    let calledCount = 0;
    server.use(
      http.get('/api/auth/me', () => {
        calledCount += 1;
        return HttpResponse.json(adminStaff);
      })
    );

    renderWithAuth(<Probe />);

    await waitFor(() => expect(screen.getByText(adminStaff.name)).toBeInTheDocument());
    expect(calledCount).toBeGreaterThanOrEqual(1);
  });

  test('refresh() を呼ぶと GET /api/auth/me が再取得される', async () => {
    let calledCount = 0;
    server.use(
      http.get('/api/auth/me', () => {
        calledCount += 1;
        return HttpResponse.json(adminStaff);
      })
    );

    const { user } = renderWithAuth(<Probe />);
    await waitFor(() => expect(screen.getByText(adminStaff.name)).toBeInTheDocument());
    const callsAfterMount = calledCount;

    await user.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => expect(calledCount).toBe(callsAfterMount + 1));
  });

  test('401レスポンス時に /login へリダイレクトされる（axiosインターセプター）', async () => {
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })));

    const original = window.location;
    const hrefSetter = vi.fn();
    // jsdom の window.location は再代入できないため、href のセッターをモックして検証する
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...original,
        set href(v: string) {
          hrefSetter(v);
        },
        get href() {
          return original.href;
        },
      },
    });

    try {
      renderWithAuth(<Probe />);
      await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith('/login'));
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});
