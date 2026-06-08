import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUser, createUser, updateUser } from '@/api/users';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { Textarea } from '@/components/dads/Textarea/Textarea';
import { RequirementBadge } from '@/components/dads/RequirementBadge/RequirementBadge';
import { FormError } from '@/components/form/FormError';
import { userSchema, type UserForm as UserFormType } from '@/schemas/userSchema';
import { Furigana } from '@/components/ui/Furigana';

export const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormType>({
    resolver: zodResolver(userSchema),
  });

  // NOTE: 編集時に取得したユーザー情報をフォームに反映する（react-hook-form の reset が必要）
  useEffect(() => {
    if (user) reset({ name: user.name, nameKana: user.nameKana ?? '', birthDate: user.birthDate ?? '', notes: user.notes ?? '' });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserFormType) =>
      isEdit
        ? updateUser({ id: Number(id), data })
        : createUser({ ...data, nameKana: data.nameKana ?? null, birthDate: data.birthDate ?? null, notes: data.notes ?? null }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate(isEdit ? `/users/${id}` : `/users/${saved.id}`);
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="text-std-14N-130 text-green-700 hover:underline">← 戻る</button>
        <PageTitle>{isEdit ? '利用者を編集' : '利用者を登録'}</PageTitle>
      </div>
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} noValidate className="flex flex-col gap-5 bg-white rounded-8 border border-solid-gray-200 p-6">
        {mutation.isError && (
          <div className="rounded-8 bg-red-50 border border-red-200 px-4 py-3 text-std-14N-130 text-red-700">
            しばらく待ってからもう一度お試しください
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="name"><Furigana text="氏名" /><RequirementBadge>必須</RequirementBadge></Label>
          <Input id="name" type="text" placeholder="例：田中 太郎" isError={!!errors.name} {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="nameKana">ふりがな<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="nameKana" type="text" placeholder="例：たなか たろう" isError={!!errors.nameKana} {...register('nameKana')} />
          <FormError message={errors.nameKana?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="birthDate">生年月日<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="birthDate" type="date" isError={!!errors.birthDate} {...register('birthDate')} />
          <FormError message={errors.birthDate?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">備考<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Textarea id="notes" rows={4} placeholder="自由記載" isError={!!errors.notes} {...register('notes')} />
          <FormError message={errors.notes?.message} />
        </div>
        <div className="flex justify-between mt-2">
          <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>キャンセル</Button>
          <Button type="submit" variant="solid-fill" size="md" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? '保存中...' : isEdit ? '保存する' : '登録する'}
          </Button>
        </div>
      </form>
    </div>
  );
};
