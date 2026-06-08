import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

/**
 * テストごとに新しい QueryClient を生成する（キャッシュ汚染とリトライによる遅延を防ぐ）
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

type ProvidersProps = {
  children: ReactNode;
  route?: string;
  withAuth?: boolean;
  queryClient?: QueryClient;
};

const Providers = ({ children, route = '/', withAuth = false, queryClient }: ProvidersProps) => {
  const client = queryClient ?? createTestQueryClient();
  const content = withAuth ? (
    <AccessibilityProvider>
      <AuthProvider>{children}</AuthProvider>
    </AccessibilityProvider>
  ) : children;

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
    </QueryClientProvider>
  );
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  withAuth?: boolean;
  queryClient?: QueryClient;
};

/**
 * QueryClientProvider・MemoryRouter（・必要に応じて Auth/Accessibility Provider）でラップして render する。
 * withAuth: true の場合、AuthContext を使うコンポーネント（Header など）を含む画面のテストに使用する。
 */
export const renderWithProviders = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { route, withAuth, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers route={route} withAuth={withAuth} queryClient={queryClient}>
        {children}
      </Providers>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
