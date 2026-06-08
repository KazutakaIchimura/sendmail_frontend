import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOffice, createOffice, updateOffice } from '@/api/offices';
import { PageTitle } from '@/components/ui/PageTitle';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Input } from '@/components/dads/Input/Input';
import { RequirementBadge } from '@/components/dads/RequirementBadge/RequirementBadge';
import { FormError } from '@/components/form/FormError';
import { officeSchema, type OfficeForm as OfficeFormType } from '@/schemas/officeSchema';
import { Furigana } from '@/components/ui/Furigana';

export const OfficeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const { data: office } = useQuery({
    queryKey: ['office', id],
    queryFn: () => getOffice(Number(id)),
    enabled: isEdit,
  });

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<OfficeFormType>({ resolver: zodResolver(officeSchema) });

  // NOTE: 編集時に取得した事業所情報をフォームに反映する（react-hook-form の reset が必要）
  useEffect(() => {
    if (office) reset({
      name: office.name,
      postalCode: office.postalCode ?? '',
      address: office.address ?? '',
      building: office.building ?? '',
      phone: office.phone ?? '',
    });
  }, [office, reset]);

  const mutation = useMutation({
    mutationFn: (data: OfficeFormType) =>
      isEdit
        ? updateOffice({ id: Number(id), data })
        : createOffice({ ...data, postalCode: data.postalCode ?? null, address: data.address ?? null, phone: data.phone ?? null, building: data.building ?? null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      navigate('/offices');
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/offices')} className="text-std-14N-130 text-green-700 hover:underline">← 戻る</button>
        <PageTitle>{isEdit ? '事業所を編集' : '事業所を登録'}</PageTitle>
      </div>
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} noValidate className="flex flex-col gap-5 bg-white rounded-8 border border-solid-gray-200 p-6">
        {mutation.isError && (
          <div className="rounded-8 bg-red-50 border border-red-200 px-4 py-3 text-std-14N-130 text-red-700">
            しばらく待ってからもう一度お試しください
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="name"><Furigana text="事業所名" /><RequirementBadge>必須</RequirementBadge></Label>
          <Input id="name" type="text" placeholder="例：グループホーム○○" isError={!!errors.name} {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="postalCode"><Furigana text="郵便番号" /><RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="postalCode" type="text" placeholder="例：123-4567" isError={!!errors.postalCode} {...register('postalCode')} />
          <FormError message={errors.postalCode?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="address"><Furigana text="住所（番地まで）" /><RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="address" type="text" placeholder="例：東京都○○区1丁目1番地1号" isError={!!errors.address} {...register('address')} />
          <FormError message={errors.address?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="building">建物名・部屋番号<RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="building" type="text" placeholder="例：○○ビル 3F" isError={!!errors.building} {...register('building')} />
          <FormError message={errors.building?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="phone"><Furigana text="電話番号" /><RequirementBadge isOptional>任意</RequirementBadge></Label>
          <Input id="phone" type="text" placeholder="例：03-0000-0000" isError={!!errors.phone} {...register('phone')} />
          <FormError message={errors.phone?.message} />
        </div>

        <div className="flex justify-between mt-2">
          <Button type="button" variant="outline" size="md" onClick={() => navigate('/offices')}>キャンセル</Button>
          <Button type="submit" variant="solid-fill" size="md" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? '保存中...' : isEdit ? '保存する' : '登録する'}
          </Button>
        </div>
      </form>
    </div>
  );
};
