import { LoginForm } from './LoginForm';

export const LoginPage = () => (
  <div className="min-h-screen bg-solid-gray-50 flex items-center justify-center">
    <div className="w-full max-w-sm">
      <h1 className="text-std-24B-150 text-solid-gray-900 text-center mb-8">
        郵便物送付管理システム
      </h1>
      <div className="bg-white rounded-8 border border-solid-gray-200 p-8">
        <LoginForm />
      </div>
    </div>
  </div>
);
