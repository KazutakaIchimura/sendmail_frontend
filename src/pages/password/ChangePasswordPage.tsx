import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePassword } from '@/api/auth';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { RequirementBadge } from '@/components/dads/RequirementBadge/RequirementBadge';
import { FormError } from '@/components/form/FormError';
import { changePasswordSchema, type ChangePasswordForm } from '@/schemas/passwordSchema';

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;
const REDIRECT_DELAY_MS = 2000;


export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setServerError('');
    try {
      await changePassword({ newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/'), REDIRECT_DELAY_MS);
    } catch (e: unknown) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      if (status === HTTP_STATUS_BAD_REQUEST || status === HTTP_STATUS_UNAUTHORIZED) {
        setServerError('パスワードの変更に失敗しました');
      } else {
        setServerError('しばらく待ってからもう一度お試しください');
      }
    }
  };

  return (
    <div className="min-h-screen bg-solid-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-std-24B-150 text-solid-gray-900 text-center mb-8">パスワードを変更する</h1>
        <div className="bg-white rounded-8 border border-solid-gray-200 p-8">
          {success ? (
            <div className="text-center">
              <p className="text-std-16N-170 text-solid-gray-900 mb-2">✅ パスワードを変更しました</p>
              <p className="text-std-14N-130 text-solid-gray-600">ダッシュボードへ移動します...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              {serverError && (
                <div className="rounded-8 bg-red-50 border border-red-200 px-4 py-3 text-std-14N-130 text-red-700">
                  {serverError}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label htmlFor="newPassword">新しいパスワード<RequirementBadge>必須</RequirementBadge></Label>
                <Input id="newPassword" type="password" isError={!!errors.newPassword} {...register('newPassword')} />
                <FormError message={errors.newPassword?.message} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="confirmPassword">新しいパスワード（確認）<RequirementBadge>必須</RequirementBadge></Label>
                <Input id="confirmPassword" type="password" isError={!!errors.confirmPassword} {...register('confirmPassword')} />
                <FormError message={errors.confirmPassword?.message} />
              </div>
              <Button type="submit" variant="solid-fill" size="md" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? '変更中...' : '変更する'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
