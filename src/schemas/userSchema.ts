import { z } from 'zod';

export const userSchema = z.object({
  name: z.string()
    .min(1, '氏名を入力してください')
    .max(100, '氏名は100文字以内で入力してください'),
  nameKana: z.string()
    .max(100, 'ふりがなは100文字以内で入力してください')
    .regex(/^[ぁ-ん\s]*$/, 'ふりがなはひらがなで入力してください（例：やまだ はなこ）')
    .optional().or(z.literal('')),
  birthDate: z.string()
    .refine(v => !v || new Date(v) < new Date(), '生年月日は過去の日付を入力してください')
    .optional().or(z.literal('')),
  notes: z.string().max(1000, '備考は1000文字以内で入力してください').optional(),
});
export type UserForm = z.infer<typeof userSchema>;
