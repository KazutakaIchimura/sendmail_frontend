import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { officeA } from '@/test/fixtures';
import { OfficeForm } from './OfficeForm';

const renderOfficeForm = (initialPath: string) => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/offices/new" element={<OfficeForm />} />
          <Route path="/offices/:id/edit" element={<OfficeForm />} />
          <Route path="/offices" element={<p>事業所一覧画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

describe('OfficeForm（新規登録）', () => {
  test('事業所名が未入力、郵便番号の形式が不正な場合バリデーションエラーが表示される', async () => {
    const { user } = renderOfficeForm('/offices/new');

    await user.type(await screen.findByLabelText(/^郵便番号/), '12345');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByText('事業所名を入力してください')).toBeInTheDocument();
    expect(screen.getByText('郵便番号は数字7桁で入力してください（例：123-4567）')).toBeInTheDocument();
  });

  test('登録に成功すると一覧画面へ遷移する', async () => {
    server.use(http.post('/api/offices', () => HttpResponse.json(officeA)));

    const { user } = renderOfficeForm('/offices/new');

    await user.type(await screen.findByLabelText(/^事業所名/), '事業所D');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText('事業所一覧画面')).toBeInTheDocument());
  });

  test('事業所種別を選択すると POST ペイロードに含まれる', async () => {
    let sentBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/offices', async ({ request }) => {
        sentBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json(officeA);
      }),
    );

    const { user } = renderOfficeForm('/offices/new');

    await user.type(await screen.findByLabelText(/^事業所名/), '新事業所');
    await user.selectOptions(screen.getByLabelText(/^事業所種別/), '就労継続支援A型');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText('事業所一覧画面')).toBeInTheDocument());
    expect((sentBody as Record<string, unknown> | null)?.['officeType']).toBe('就労継続支援A型');
  });

  test('事業所種別を選択しない場合は null として POST される', async () => {
    let sentBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/offices', async ({ request }) => {
        sentBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json(officeA);
      }),
    );

    const { user } = renderOfficeForm('/offices/new');

    await user.type(await screen.findByLabelText(/^事業所名/), '新事業所');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => expect(screen.getByText('事業所一覧画面')).toBeInTheDocument());
    expect((sentBody as Record<string, unknown> | null)?.['officeType']).toBeNull();
  });

  test('登録に失敗するとエラーメッセージが表示される', async () => {
    server.use(http.post('/api/offices', () => new HttpResponse(null, { status: 500 })));

    const { user } = renderOfficeForm('/offices/new');
    await user.type(await screen.findByLabelText(/^事業所名/), '新事業所');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByText('しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });
});

describe('OfficeForm（編集）', () => {
  test('編集時は既存の事業所情報がフォームに反映される', async () => {
    server.use(http.get('/api/offices/:id', () => HttpResponse.json(officeA)));

    renderOfficeForm(`/offices/${officeA.id}/edit`);

    await waitFor(() => expect(screen.getByLabelText(/^事業所名/)).toHaveValue(officeA.name));
    expect(screen.getByLabelText(/^郵便番号/)).toHaveValue(officeA.postalCode);
    expect(screen.getByLabelText(/^住所/)).toHaveValue(officeA.address);
    expect(screen.getByLabelText(/^事業所種別/)).toHaveValue(officeA.officeType);
  });

  test('編集に成功すると一覧画面へ遷移する', async () => {
    server.use(
      http.get('/api/offices/:id', () => HttpResponse.json(officeA)),
      http.put('/api/offices/:id', () => HttpResponse.json(officeA))
    );

    const { user } = renderOfficeForm(`/offices/${officeA.id}/edit`);
    await waitFor(() => expect(screen.getByLabelText(/^事業所名/)).toHaveValue(officeA.name));
    await user.click(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(screen.getByText('事業所一覧画面')).toBeInTheDocument());
  });
});
