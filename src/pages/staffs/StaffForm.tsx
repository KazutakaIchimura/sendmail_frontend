import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStaffs, createStaff, updateStaff } from '@/api/staffs';
import { useAuth } from '@/contexts/AuthContext';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { Select } from '@/components/dads/Select/Select';
import { RequirementBadge } from '@/components/dads/RequirementBadge/RequirementBadge';
import { FormError } from '@/components/form/FormError';
import { staffCreateSchema, staffEditSchema, type StaffForm as StaffFormType } from '@/schemas/staffSchema';
import { Furigana } from '@/components/ui/Furigana';

const HTTP_STATUS_CONFLICT = 409;

export const StaffForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const { currentStaff, refresh } = useAuth();

  const { data: staffs = [] } = useQuery({ queryKey: ['staffs'], queryFn: () => getStaffs({ includeInactive: true }), enabled: isEdit });
  const staff = staffs.find(s => s.id === Number(id));

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<StaffFormType>({
    resolver: zodResolver(isEdit ? staffEditSchema : staffCreateSchema),
  });

  // NOTE: 編集時に取得したスタッフ情報をフォームに反映する（react-hook-form の reset が必要）
  useEffect(() => {
    if (staff) reset({ name: staff.name, email: staff.email, role: staff.role, password: '' });
  }, [staff, reset]);

  const mutation = useMutation({
    mutationFn: (data: StaffFormType) =>
      isEdit
        ? updateStaff({ id: Number(id), data: { name: data.name, email: data.email, role: data.role } })
        : createStaff(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] });
      if (isEdit && Number(id) === currentStaff?.id) {
        await refresh();
      }
      navigate('/staffs');
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.status === HTTP_STATUS_CONFLICT) {
        setError('email', { message: 'このメールアドレスはすでに登録されています。別のアドレスをお使いください' });
      }
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/staffs')} className="text-std-14N-130 text-green-700 hover:underline">← 戻る</button>
        <PageTitle>{isEdit ? 'スタッフを編集' : 'スタッフを登録'}</PageTitle>
      </div>
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} noValidate className="flex flex-col gap-5 bg-white rounded-8 border border-solid-gray-200 p-6">
        {mutation.isError && !errors.email && (
          <div className="rounded-8 bg-red-50 border border-red-200 px-4 py-3 text-std-14N-130 text-red-700">
            しばらく待ってからもう一度お試しください
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="name"><Furigana text="氏名" /><RequirementBadge>必須</RequirementBadge></Label>
          <Input id="name" type="text" placeholder="例：山田 太郎" isError={!!errors.name} {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">メールアドレス<RequirementBadge>必須</RequirementBadge></Label>
          <Input id="email" type="email" placeholder="例：yamada@example.com" isError={!!errors.email} {...register('email')} />
          <FormError message={errors.email?.message} />
        </div>
        {!isEdit && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">パスワード<RequirementBadge>必須</RequirementBadge></Label>
            <Input id="password" type="password" isError={!!errors.password} {...register('password')} />
            <FormError message={errors.password?.message} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="role"><Furigana text="権限" /><RequirementBadge>必須</RequirementBadge></Label>
          <Select id="role" isError={!!errors.role} {...register('role')}>
            <option value="">選んでください</option>
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
          <FormError message={errors.role?.message} />
        </div>
        <div className="flex justify-between mt-2">
          <Button type="button" variant="outline" size="md" onClick={() => navigate('/staffs')}>キャンセル</Button>
          <Button type="submit" variant="solid-fill" size="md" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? '保存中...' : isEdit ? '保存する' : '登録する'}
          </Button>
        </div>
      </form>
    </div>
  );
};
