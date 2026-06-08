import { z } from 'zod';

export const changePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, '新しいパスワードは8文字以上で、英字（a〜z）と数字（0〜9）をまぜて設定してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/,
      '新しいパスワードは8文字以上で、英字（a〜z）と数字（0〜9）をまぜて設定してください'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: '上で入力した新しいパスワードと同じ内容を入力してください',
  path: ['confirmPassword'],
});
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
