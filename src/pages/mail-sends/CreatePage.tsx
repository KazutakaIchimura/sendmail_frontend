import axios from 'axios';
import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, getUserOffices } from '@/api/users';
import { createMailSend } from '@/api/mailSends';
import { PageTitle } from '@/components/ui/PageTitle';
import { Furigana } from '@/components/ui/Furigana';
import { Button } from '@/components/dads/Button/Button';
import { Label } from '@/components/dads/Label/Label';
import { Select } from '@/components/dads/Select/Select';
import { Radio } from '@/components/dads/Radio/Radio';
import { Checkbox } from '@/components/dads/Checkbox/Checkbox';
import { RequirementBadge } from '@/components/dads/RequirementBadge/RequirementBadge';

type SendType = 'PLAN' | 'MONITORING';

type FormData = {
  userId: number | null;
  officeId: number | null;
  sendTypes: SendType[];
  sendYear: string;
  sendMonth: string;
};

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = String(NOW.getMonth() + 1).padStart(2, '0');

const STEPS = ['利用者選択', '事業所選択', '送付種別', '送付月', '確認'];

const SEND_TYPE_LABEL: Record<SendType, string> = {
  PLAN: '計画作成（基本情報・サービス等利用計画・週間予定表）',
  MONITORING: 'モニタリング（モニタリング報告書）',
};

const HTTP_STATUS_CONFLICT = 409;

type StepIndicatorProps = { current: number };

const StepIndicator = ({ current }: StepIndicatorProps) => (
  <ol className="flex items-center gap-0 mb-8">
    {STEPS.map((label, i) => (
      <li key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <span className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-std-14B-130 border-2',
            i < current ? 'bg-green-700 border-green-700 text-white' :
            i === current ? 'border-green-700 text-green-700 bg-white' :
            'border-solid-gray-300 text-solid-gray-400 bg-white'
          )}>{i + 1}</span>
          <span className={clsx(
            'text-xs',
            i === current ? 'text-green-700 font-bold' : 'text-solid-gray-500'
          )}>{label}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={clsx('h-0.5 w-12 mx-1 mb-5', i < current ? 'bg-green-700' : 'bg-solid-gray-200')} />
        )}
      </li>
    ))}
  </ol>
);

export const CreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    userId: null, officeId: null, sendTypes: [],
    sendYear: String(CURRENT_YEAR), sendMonth: CURRENT_MONTH,
  });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { data: offices = [] } = useQuery({
    queryKey: ['userOffices', form.userId],
    queryFn: () => getUserOffices(form.userId!),
    enabled: !!form.userId,
  });

  const activeUsers = users.filter(u => u.isActive);
  const selectedUser = users.find(u => u.id === form.userId);
  const selectedOffice = offices.find(o => o.id === form.officeId);
  const sendMonthValue = `${form.sendYear}-${form.sendMonth}-01`;

  const years = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  const toggleSendType = (type: SendType) => {
    setForm(f => ({
      ...f,
      sendTypes: f.sendTypes.includes(type)
        ? f.sendTypes.filter(t => t !== type)
        : [...f.sendTypes, type],
    }));
  };

  /**
   * 選択された送付種別を一括で登録する。409 の場合は重複エラーを表示する
   */
  const handleSubmit = async () => {
    if (!form.userId || !form.officeId || form.sendTypes.length === 0) return;
    setIsSubmitting(true);
    setServerError('');

    const results = await Promise.allSettled(
      form.sendTypes.map(sendType =>
        createMailSend({ userId: form.userId!, officeId: form.officeId!, sendType, sendMonth: sendMonthValue })
      )
    );

    setIsSubmitting(false);

    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length === 0) {
      queryClient.invalidateQueries({ queryKey: ['mailSendsByOffice'] });
      navigate('/mail-sends/by-office');
      return;
    }

    const isDuplicate = failed.some(r => axios.isAxiosError(r.reason) && r.reason.response?.status === HTTP_STATUS_CONFLICT);
    setServerError(isDuplicate
      ? '同じ内容の送付物がすでに登録されています。内容をご確認ください'
      : 'しばらく待ってからもう一度お試しください'
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <PageTitle><span aria-hidden="true">➕ </span><Furigana text="送付物を新規登録" /></PageTitle>
      </div>
      <StepIndicator current={step} />

      {/* STEP 0: 利用者選択 */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-std-14N-130 text-solid-gray-700">対象の利用者を選んでください<RequirementBadge>必須</RequirementBadge></p>
          <ul className="bg-white border border-solid-gray-200 rounded-8 divide-y divide-solid-gray-100">
            {activeUsers.map(u => (
              <li key={u.id}>
                <label className={clsx(
                  'flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-solid-gray-50',
                  form.userId === u.id && 'bg-green-50'
                )}>
                  <Radio name="userId" value={String(u.id)} checked={form.userId === u.id} onChange={() => setForm(f => ({ ...f, userId: u.id, officeId: null }))} />
                  <div>
                    <span className="text-std-16N-170 text-solid-gray-900">{u.name}</span>
                    {u.nameKana && <span className="text-std-14N-130 text-solid-gray-500 ml-2">{u.nameKana}</span>}
                  </div>
                </label>
              </li>
            ))}
            {activeUsers.length === 0 && <li className="px-4 py-3 text-std-14N-130 text-solid-gray-500">登録されている利用者がいません</li>}
          </ul>
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="md" onClick={() => navigate('/')}>キャンセル</Button>
            <Button variant="solid-fill" size="md" disabled={!form.userId} onClick={() => setStep(1)}>次へ →</Button>
          </div>
        </div>
      )}

      {/* STEP 1: 事業所選択 */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-std-14N-130 text-solid-gray-600">利用者: <strong>{selectedUser?.name}</strong></p>
          <div className="flex flex-col gap-1">
            <Label>送付先事業所<RequirementBadge>必須</RequirementBadge></Label>
            <p className="text-std-14N-130 text-solid-gray-500">※ 利用者を選ぶと候補が絞られます</p>
          </div>
          <ul className="bg-white border border-solid-gray-200 rounded-8 divide-y divide-solid-gray-100">
            {offices.map(o => (
              <li key={o.id}>
                <label className={clsx(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-solid-gray-50',
                  form.officeId === o.id && 'bg-green-50'
                )}>
                  <Radio name="officeId" value={String(o.id)} checked={form.officeId === o.id} onChange={() => setForm(f => ({ ...f, officeId: o.id }))} />
                  <span className="text-std-14N-130 text-solid-gray-900">{o.name}</span>
                </label>
              </li>
            ))}
            {offices.length === 0 && <li className="px-4 py-3 text-std-14N-130 text-solid-gray-500">紐付き事業所がありません</li>}
          </ul>
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="md" onClick={() => setStep(0)}>← 戻る</Button>
            <Button variant="solid-fill" size="md" disabled={!form.officeId} onClick={() => setStep(2)}>次へ →</Button>
          </div>
        </div>
      )}

      {/* STEP 2: 送付種別（複数選択可） */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="text-std-16N-170 text-solid-gray-900 mb-1">
              送付種別<RequirementBadge>必須</RequirementBadge>
            </legend>
            <p className="text-std-14N-130 text-solid-gray-500 mb-3">複数選択できます</p>
            <div className="flex flex-col gap-3">
              {(['PLAN', 'MONITORING'] as const).map(type => (
                <label key={type} className={clsx(
                  'flex items-start gap-3 px-4 py-3 rounded-8 border cursor-pointer hover:bg-solid-gray-50',
                  form.sendTypes.includes(type)
                    ? 'border-green-700 bg-green-50'
                    : 'border-solid-gray-200 bg-white'
                )}>
                  <Checkbox
                    checked={form.sendTypes.includes(type)}
                    onChange={() => toggleSendType(type)}
                    className="mt-0.5"
                  />
                  <span className="text-std-14N-130 text-solid-gray-900">{SEND_TYPE_LABEL[type]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="md" onClick={() => setStep(1)}>← 戻る</Button>
            <Button variant="solid-fill" size="md" disabled={form.sendTypes.length === 0} onClick={() => setStep(3)}>次へ →</Button>
          </div>
        </div>
      )}

      {/* STEP 3: 送付月 */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>送付予定月<RequirementBadge>必須</RequirementBadge></Label>
            <div className="flex items-center gap-2">
              <Select blockSize="md" value={form.sendYear} onChange={e => setForm(f => ({ ...f, sendYear: e.target.value }))}>
                {years.map(y => <option key={y} value={y}>{y}年</option>)}
              </Select>
              <Select blockSize="md" value={form.sendMonth} onChange={e => setForm(f => ({ ...f, sendMonth: e.target.value }))}>
                {months.map(m => <option key={m} value={m}>{parseInt(m)}月</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="md" onClick={() => setStep(2)}>← 戻る</Button>
            <Button variant="solid-fill" size="md" onClick={() => setStep(4)}>確認画面へ →</Button>
          </div>
        </div>
      )}

      {/* STEP 4: 確認 */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-8 border border-solid-gray-200 divide-y divide-solid-gray-100">
            {[
              { label: '利用者', value: selectedUser?.name },
              { label: '送付先事業所', value: selectedOffice?.name },
              { label: '送付種別', value: form.sendTypes.map(t => SEND_TYPE_LABEL[t]).join('・') },
              { label: '送付予定月', value: `${form.sendYear}年${parseInt(form.sendMonth)}月` },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-4 py-3">
                <span className="text-std-14B-130 text-solid-gray-700 w-28 shrink-0">{label}</span>
                <span className="text-std-14N-130 text-solid-gray-900">{value}</span>
              </div>
            ))}
          </div>
          {form.sendTypes.length === 2 && (
            <p className="text-std-14N-130 text-solid-gray-600">
              計画作成・モニタリングの2件を一括登録します。
            </p>
          )}
          {serverError && <p className="text-std-14N-130 text-red-600" role="alert">{serverError}</p>}
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="md" onClick={() => { setStep(3); setServerError(''); }}>← 戻る</Button>
            <Button variant="solid-fill" size="md" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '登録中...' : `${form.sendTypes.length}件を登録する`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
