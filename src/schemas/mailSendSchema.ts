import { z } from 'zod';

export const createMailSendSchema = z.object({
  userId:    z.number({ error: '利用者を選んでください' }),
  officeId:  z.number({ error: '送付先の事業所を選んでください' }),
  sendType:  z.enum(['PLAN', 'MONITORING'] as const, {
    error: '送付の種類を選んでください',
  }),
  sendMonth: z.string().min(1, '送付する月を選んでください'),
});
export type CreateMailSendForm = z.infer<typeof createMailSendSchema>;

export const batchSchema = z.object({
  mailSendIds: z.array(z.number()).min(1, '送付済みにしたい項目にチェックを入れてください'),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
});
export type BatchForm = z.infer<typeof batchSchema>;
