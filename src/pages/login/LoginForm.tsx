import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { Button } from '@/components/dads/Button/Button';
import { FormError } from '@/components/form/FormError';
import { login, getMe } from '@/api/auth';
import { loginSchema, type LoginForm as LoginFormType } from '@/schemas/loginSchema';

const HTTP_STATUS_UNAUTHORIZED = 401;

export const LoginForm = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormType) => {
    setServerError('');
    try {
      await login(data);
      const staff = await getMe();
      if (staff.forcePasswordChange) {
        navigate('/password/change');
      } else {
        navigate('/');
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === HTTP_STATUS_UNAUTHORIZED) {
        setServerError('メールアドレスまたはパスワードが正しくありません');
      } else {
        const status = axios.isAxiosError(e) ? (e.response?.status ?? 'network error') : 'unknown';
        setServerError(`エラー [${status}]: しばらく待ってからもう一度お試しください`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div className="rounded-8 bg-red-50 border border-red-200 px-4 py-3 text-std-14N-130 text-red-700">
          {serverError}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="例：yamada@example.com"
          isError={!!errors.email}
          {...register('email')}
        />
        <FormError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          type="password"
          isError={!!errors.password}
          {...register('password')}
        />
        <FormError message={errors.password?.message} />
      </div>
      <Button type="submit" variant="solid-fill" size="md" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
};
