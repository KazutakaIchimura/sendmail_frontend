import { describe, expect, test } from 'vitest';
import { changePasswordSchema } from './passwordSchema';

describe('changePasswordSchema', () => {
  test('新しいパスワードが8文字未満の場合エラーになる', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'abc123', confirmPassword: 'abc123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'newPassword')).toBe(true);
  });

  test('新しいパスワードに英字が含まれない場合エラーになる', () => {
    const result = changePasswordSchema.safeParse({ newPassword: '12345678', confirmPassword: '12345678' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'newPassword')).toBe(true);
  });

  test('新しいパスワードに数字が含まれない場合エラーになる', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'newPassword')).toBe(true);
  });

  test('確認パスワードが新しいパスワードと一致しない場合エラーになる', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'abcd1234', confirmPassword: 'abcd9999' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'confirmPassword')).toBe(true);
  });

  test('条件を満たすパスワードでバリデーションが通る', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'abcd1234', confirmPassword: 'abcd1234' });
    expect(result.success).toBe(true);
  });
});
