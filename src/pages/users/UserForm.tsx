import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUser, createUser, updateUser } from '@/api/users';
import { getStaffs } from '@/api/staffs';
import { useAuth } from '@/contexts/AuthContext';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { Select } from '@/components/dads/Select/Select';
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
  const { isAdmin } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(Number(id)),
    enabled: isEdit,
  });

  const { data: staffs = [] } = useQuery({
    queryKey: ['staffs'],
    queryFn: () => getStaffs(),
    enabled: isAdmin,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<UserFormType>({
    resolver: zodResolver(userSchema),
  });
  const watchedStaffId = watch('assignedStaffId');

  // NOTE: 編集時に取得したユーザー情報をフォームに反映する（react-hook-form の reset が必要）
  useEffect(() => {
    if (user) reset({
      name: user.name,
      nameKana: user.nameKana ?? '',
      birthDate: user.birthDate ?? '',
      notes: user.notes ?? '',
      recipientNumber: user.recipientNumber ?? '',
      disabilitySupportCategory: user.disabilitySupportCategory ?? null,
      assignedStaffId: user.assignedStaffId ?? null,
    });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserFormType) =>
      isEdit
        ? updateUser({
            id: Number(id),
            data: {
              name: data.name,
              nameKana: data.nameKana || null,
              notes: data.notes || null,
              recipientNumber: data.recipientNumber || null,
              disabilitySupportCategory: data.disabilitySupportCategory ?? null,
              ...(data.birthDate ? { birthDate: data.birthDate } : {}),
              assignedStaffId: isAdmin ? (data.assignedStaffId ?? null) : null,
            },
          })
        : createUser({
            name: data.name,
            nameKana: data.nameKana || null,
            birthDate: data.birthDate || null,
            notes: data.notes || null,
            recipientNumber: data.recipientNumber || null,
            disabilitySupportCategory: data.disabilitySupportCategory ?? null,
            assignedStaffId: isAdmin ? (data.assignedStaffId ?? null) : null,
          }),
    onSuccess: async (saved) => {
      // 遷移先の一覧/詳細画面はこの時点でまだマウントされておらずアクティブな観測者がいないため、
      // refetchType省略時の既定（'active'のみ再取得）では何もせず即解決してしまう。
      // 'all'を指定して未観測のキャッシュも強制的に再取得し、navigate後の初回表示を
      // 最新データにする。
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['user', id], refetchType: 'all' }),
      ]);
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
          <p className="text-xs text-solid-gray-500">
            支援方針・コミュニケーション上の配慮・家族状況など、送付管理に関連する情報を記載してください。
            住所・電話番号は事業所管理で、受給者証番号は専用フィールドに入力してください。
          </p>
          <Textarea id="notes" rows={4} placeholder="例：計画相談のほか移動支援も利用中。連絡は午後が望ましい。" isError={!!errors.notes} {...register('notes')} />
          <FormError message={errors.notes?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="recipientNumber">受給者証番号<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="recipientNumber" type="text" placeholder="例：0123456789" isError={!!errors.recipientNumber} {...register('recipientNumber')} />
          <FormError message={errors.recipientNumber?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="disabilitySupportCategory">障害支援区分<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Select
            id="disabilitySupportCategory"
            value={watch('disabilitySupportCategory') ?? ''}
            onChange={e => setValue('disabilitySupportCategory', e.target.value || null)}
          >
            <option value="">未設定</option>
            <option value="非該当">非該当</option>
            <option value="区分1">区分1</option>
            <option value="区分2">区分2</option>
            <option value="区分3">区分3</option>
            <option value="区分4">区分4</option>
            <option value="区分5">区分5</option>
            <option value="区分6">区分6</option>
          </Select>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="assignedStaffId">担当スタッフ<RequirementBadge isOptional>任意</RequirementBadge></Label>
            <Select
              id="assignedStaffId"
              value={watchedStaffId != null ? String(watchedStaffId) : ''}
              onChange={e => setValue('assignedStaffId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">担当なし</option>
              {staffs.filter(s => s.isActive).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
        )}
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
