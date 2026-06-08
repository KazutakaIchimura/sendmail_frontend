import { describe, expect, test } from 'vitest';
import { loginSchema } from './loginSchema';

describe('loginSchema', () => {
  test('メールアドレスが空の場合エラーになる', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'email')).toBe(true);
  });

  test('メールアドレスの形式が不正な場合エラーになる', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'email')).toBe(true);
  });

  test('パスワードが空の場合エラーになる', () => {
    const result = loginSchema.safeParse({ email: 'yamada@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'password')).toBe(true);
  });

  test('正しい形式の入力ではバリデーションが通る', () => {
    const result = loginSchema.safeParse({ email: 'yamada@example.com', password: 'password1' });
    expect(result.success).toBe(true);
  });
});
