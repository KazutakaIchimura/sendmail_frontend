import { describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen, waitFor, userEvent } from '@/test/test-utils';
import { server } from '@/test/server';
import { adminStaff, staffMember } from '@/test/fixtures';
import { Header } from './Header';

describe('Header', () => {
  test('ログイン中のスタッフ名が表示される', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(staffMember)));

    renderWithProviders(<Header />, { withAuth: true });

    await waitFor(() => expect(screen.getByText(staffMember.name)).toBeInTheDocument());
  });

  test('ADMIN の場合「スタッフ管理」リンクが表示される', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(adminStaff)));

    renderWithProviders(<Header />, { withAuth: true });

    await waitFor(() => expect(screen.getByText(adminStaff.name)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'スタッフ管理' })).toBeInTheDocument();
  });

  test('STAFF の場合「スタッフ管理」リンクが表示されない', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(staffMember)));

    renderWithProviders(<Header />, { withAuth: true });

    await waitFor(() => expect(screen.getByText(staffMember.name)).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'スタッフ管理' })).not.toBeInTheDocument();
  });

  test('アクセシビリティ設定ボタンをクリックするとパネルが開く', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(adminStaff)));

    const user = userEvent.setup();
    renderWithProviders(<Header />, { withAuth: true });

    await waitFor(() => expect(screen.getByText(adminStaff.name)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'つかいやすさの設定をひらく' }));

    expect(await screen.findByRole('dialog', { name: 'つかいやすさの設定' })).toBeInTheDocument();
  });

  test('「ログアウト」をクリックすると /login へ遷移する', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(adminStaff)),
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 }))
    );

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
      const user = userEvent.setup();
      renderWithProviders(<Header />, { withAuth: true });

      await waitFor(() => expect(screen.getByText(adminStaff.name)).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: 'ログアウト' }));

      await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith('/login'));
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});
