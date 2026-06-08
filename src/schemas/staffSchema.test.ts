import { describe, expect, test } from 'vitest';
import { staffCreateSchema, staffEditSchema } from './staffSchema';

const validBase = {
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'STAFF' as const,
};

describe('staffCreateSchema（登録）', () => {
  test('氏名が空の場合エラーになる', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, name: '', password: 'abcd1234' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'name')).toBe(true);
  });

  test('メールアドレスの形式が不正な場合エラーになる', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, email: 'invalid-email', password: 'abcd1234' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'email')).toBe(true);
  });

  test('パスワードが空の場合エラーになる', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'password')).toBe(true);
  });

  test('パスワードが8文字未満の場合エラーになる', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, password: 'ab1' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'password')).toBe(true);
  });

  test('英字・数字を含む8文字以上のパスワードでバリデーションが通る', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, password: 'abcd1234' });
    expect(result.success).toBe(true);
  });

  test('権限が未選択の場合エラーになる', () => {
    const result = staffCreateSchema.safeParse({ ...validBase, role: undefined, password: 'abcd1234' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'role')).toBe(true);
  });
});

describe('staffEditSchema（編集）', () => {
  test('パスワードが空でもバリデーションが通る', () => {
    const result = staffEditSchema.safeParse({ ...validBase, password: '' });
    expect(result.success).toBe(true);
  });

  test('氏名・メールアドレス・権限が揃えばバリデーションが通る', () => {
    const result = staffEditSchema.safeParse({ ...validBase, password: '' });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(validBase);
  });
});
