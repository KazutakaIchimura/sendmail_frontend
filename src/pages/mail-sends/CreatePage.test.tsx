import { describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, userEvent, createTestQueryClient } from '@/test/test-utils';
import { server } from '@/test/server';
import { userTanaka, userYamada, officeA, officeB } from '@/test/fixtures';
import { CreatePage } from './CreatePage';

const renderCreatePage = () => {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/mail-sends/new']}>
        <Routes>
          <Route path="/mail-sends/new" element={<CreatePage />} />
          <Route path="/mail-sends/by-office" element={<p>送付先別一覧画面</p>} />
          <Route path="/" element={<p>ダッシュボード画面</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user: userEvent.setup() };
};

type User = ReturnType<typeof userEvent.setup>;

const goToOfficeStep = async (user: User) => {
  await user.click(await screen.findByText(userTanaka.name));
  await user.click(screen.getByRole('button', { name: '次へ →' }));
};

const goToConfirmStep = async (user: User) => {
  await goToOfficeStep(user);
  await user.click(await screen.findByText(officeA.name));
  await user.click(screen.getByRole('button', { name: '次へ →' }));
  await user.click(screen.getByRole('checkbox', { name: /計画作成/ }));
  await user.click(screen.getByRole('button', { name: '次へ →' }));
  await user.click(screen.getByRole('button', { name: '確認画面へ →' }));
};

describe('CreatePage（送付物作成）', () => {
  test('STEP1: 利用者を選択するまで「次へ」ボタンが無効になっている', async () => {
    const { user } = renderCreatePage();

    expect(await screen.findByText(userTanaka.name)).toBeInTheDocument();
    expect(screen.getByText(userYamada.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ →' })).toBeDisabled();

    await user.click(screen.getByText(userTanaka.name));
    expect(screen.getByRole('button', { name: '次へ →' })).toBeEnabled();
  });

  test('STEP2: 全事業所が表示され、複数選択できる', async () => {
    const { user } = renderCreatePage();
    await goToOfficeStep(user);

    expect(await screen.findByText(officeA.name)).toBeInTheDocument();
    expect(screen.getByText(officeB.name)).toBeInTheDocument();

    const officeACheckbox = screen.getByRole('checkbox', { name: officeA.name });
    const officeBCheckbox = screen.getByRole('checkbox', { name: officeB.name });
    await user.click(officeACheckbox);
    await user.click(officeBCheckbox);

    expect(officeACheckbox).toBeChecked();
    expect(officeBCheckbox).toBeChecked();
  });

  test('STEP2: 事業所を選択するまで「次へ」ボタンが無効になっている', async () => {
    const { user } = renderCreatePage();
    await goToOfficeStep(user);

    expect(await screen.findByText(officeA.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ →' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: officeA.name }));
    expect(screen.getByRole('button', { name: '次へ →' })).toBeEnabled();
  });

  test('STEP3: 送付種別は複数選択できる', async () => {
    const { user } = renderCreatePage();
    await goToOfficeStep(user);
    await user.click(await screen.findByText(officeA.name));
    await user.click(screen.getByRole('button', { name: '次へ →' }));

    const planCheckbox = screen.getByRole('checkbox', { name: /計画作成/ });
    const monitoringCheckbox = screen.getByRole('checkbox', { name: /モニタリング/ });

    await user.click(planCheckbox);
    await user.click(monitoringCheckbox);

    expect(planCheckbox).toBeChecked();
    expect(monitoringCheckbox).toBeChecked();
    expect(screen.getByRole('button', { name: '次へ →' })).toBeEnabled();
  });

  test('STEP4: 送付予定月の年・月を変更できる', async () => {
    const { user } = renderCreatePage();
    await goToOfficeStep(user);
    await user.click(await screen.findByText(officeA.name));
    await user.click(screen.getByRole('button', { name: '次へ →' }));
    await user.click(screen.getByRole('checkbox', { name: /計画作成/ }));
    await user.click(screen.getByRole('button', { name: '次へ →' }));

    const [yearSelect, monthSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(yearSelect, '2027');
    await user.selectOptions(monthSelect, '12');

    expect(yearSelect).toHaveValue('2027');
    expect(monthSelect).toHaveValue('12');
  });

  test('確認画面に選択した利用者・事業所・送付種別・送付予定月が表示される', async () => {
    const { user } = renderCreatePage();
    await goToConfirmStep(user);

    expect(await screen.findByText('利用者')).toBeInTheDocument();
    expect(screen.getByText('送付先事業所')).toBeInTheDocument();
    expect(screen.getByText(userTanaka.name)).toBeInTheDocument();
    expect(screen.getByText(officeA.name)).toBeInTheDocument();
    expect(screen.getByText(/計画作成/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1件を登録する' })).toBeInTheDocument();
  });

  test('登録に成功すると送付先別一覧画面へ遷移する', async () => {
    server.use(http.post('/api/mail-sends', () => HttpResponse.json({})));

    const { user } = renderCreatePage();
    await goToConfirmStep(user);

    await user.click(screen.getByRole('button', { name: '1件を登録する' }));

    await waitFor(() => expect(screen.getByText('送付先別一覧画面')).toBeInTheDocument());
  });

  test('重複登録（409）の場合は専用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/mail-sends', () => HttpResponse.json({ message: 'duplicate' }, { status: 409 })));

    const { user } = renderCreatePage();
    await goToConfirmStep(user);

    await user.click(screen.getByRole('button', { name: '1件を登録する' }));

    expect(await screen.findByText('同じ内容の送付物がすでに登録されています。内容をご確認ください')).toBeInTheDocument();
  });

  test('サーバーエラー時は汎用のエラーメッセージが表示される', async () => {
    server.use(http.post('/api/mail-sends', () => HttpResponse.json({ message: 'error' }, { status: 500 })));

    const { user } = renderCreatePage();
    await goToConfirmStep(user);

    await user.click(screen.getByRole('button', { name: '1件を登録する' }));

    expect(await screen.findByText('しばらく待ってからもう一度お試しください')).toBeInTheDocument();
  });

  test('事業所×送付種別の組み合わせの数だけ登録APIが呼ばれる', async () => {
    let callCount = 0;
    server.use(http.post('/api/mail-sends', () => {
      callCount++;
      return HttpResponse.json({});
    }));

    const { user } = renderCreatePage();
    await goToOfficeStep(user);
    await user.click(screen.getByRole('checkbox', { name: officeA.name }));
    await user.click(screen.getByRole('checkbox', { name: officeB.name }));
    await user.click(screen.getByRole('button', { name: '次へ →' }));
    await user.click(screen.getByRole('checkbox', { name: /計画作成/ }));
    await user.click(screen.getByRole('checkbox', { name: /モニタリング/ }));
    await user.click(screen.getByRole('button', { name: '次へ →' }));
    await user.click(screen.getByRole('button', { name: '確認画面へ →' }));

    expect(screen.getByRole('button', { name: '4件を登録する' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '4件を登録する' }));

    await waitFor(() => expect(callCount).toBe(4));
  });

  test('一部の組み合わせのみ失敗した場合、成功・失敗件数を表示し失敗分のみ再送信対象にする', async () => {
    let callIndex = 0;
    server.use(http.post('/api/mail-sends', () => {
      callIndex++;
      if (callIndex === 2) {
        return HttpResponse.json({ message: 'duplicate' }, { status: 409 });
      }
      return HttpResponse.json({});
    }));

    const { user } = renderCreatePage();
    await goToOfficeStep(user);
    await user.click(screen.getByRole('checkbox', { name: officeA.name }));
    await user.click(screen.getByRole('checkbox', { name: officeB.name }));
    await user.click(screen.getByRole('button', { name: '次へ →' }));
    await user.click(screen.getByRole('checkbox', { name: /計画作成/ }));
    await user.click(screen.getByRole('button', { name: '次へ →' }));
    await user.click(screen.getByRole('button', { name: '確認画面へ →' }));

    await user.click(screen.getByRole('button', { name: '2件を登録する' }));

    expect(await screen.findByText('1件登録しました。残り1件は重複のため失敗しました。もう一度お試しください')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1件を登録する' })).toBeInTheDocument();
  });
});
