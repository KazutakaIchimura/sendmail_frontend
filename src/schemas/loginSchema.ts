import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスは ◯◯@◯◯.◯◯ の形で入力してください'),
  password: z.string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
});
export type LoginForm = z.infer<typeof loginSchema>;
