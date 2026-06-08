import { z } from 'zod';

const PASSWORD_ERROR = 'パスワードは8文字以上で、英字（a〜z）と数字（0〜9）をまぜて設定してください';
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).+$/;

const staffBaseSchema = z.object({
  name: z.string().min(1, '氏名を入力してください').max(100),
  email: z.string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスは ◯◯@◯◯.◯◯ の形で入力してください'),
  password: z.string(),
  role: z.enum(['ADMIN', 'STAFF'] as const, { error: '権限を選んでください' }),
});

export const staffCreateSchema = staffBaseSchema.superRefine((data, ctx) => {
  if (data.password.length < 8 || !PASSWORD_REGEX.test(data.password)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: PASSWORD_ERROR, path: ['password'] });
  }
});

export const staffEditSchema = staffBaseSchema;

export type StaffForm = z.infer<typeof staffBaseSchema>;
