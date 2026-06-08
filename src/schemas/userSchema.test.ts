import { describe, expect, test } from 'vitest';
import { userSchema } from './userSchema';

describe('userSchema', () => {
  test('氏名が空の場合エラーになる', () => {
    const result = userSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'name')).toBe(true);
  });

  test('氏名が100文字を超える場合エラーになる', () => {
    const result = userSchema.safeParse({ name: 'あ'.repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'name')).toBe(true);
  });

  test('任意項目（ふりがな・生年月日・備考）は空でもエラーにならない', () => {
    const result = userSchema.safeParse({
      name: '田中 太郎',
      nameKana: '',
      birthDate: '',
      notes: '',
    });
    expect(result.success).toBe(true);
  });
});
