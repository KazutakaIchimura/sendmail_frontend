import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ByOfficePage } from '@/pages/mail-sends/ByOfficePage';
import { CreatePage } from '@/pages/mail-sends/CreatePage';
import { HistoryPage } from '@/pages/mail-sends/HistoryPage';
import { UserListPage } from '@/pages/users/UserListPage';
import { UserDetailPage } from '@/pages/users/UserDetailPage';
import { UserForm } from '@/pages/users/UserForm';
import { OfficeListPage } from '@/pages/offices/OfficeListPage';
import { OfficeForm } from '@/pages/offices/OfficeForm';
import { StaffListPage } from '@/pages/staffs/StaffListPage';
import { StaffForm } from '@/pages/staffs/StaffForm';
import { ChangePasswordPage } from '@/pages/password/ChangePasswordPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password/change" element={<ChangePasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mail-sends/by-office" element={<ByOfficePage />} />
          <Route path="/mail-sends/new" element={<CreatePage />} />
          <Route path="/mail-sends/history" element={<HistoryPage />} />
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
          <Route path="/offices" element={<OfficeListPage />} />
          <Route path="/offices/new" element={<OfficeForm />} />
          <Route path="/offices/:id/edit" element={<OfficeForm />} />
          <Route path="/staffs" element={<StaffListPage />} />
          <Route path="/staffs/new" element={<StaffForm />} />
          <Route path="/staffs/:id/edit" element={<StaffForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
