import { describe, expect, test } from 'vitest';
import { officeSchema } from './officeSchema';

describe('officeSchema', () => {
  test('事業所名が空の場合エラーになる', () => {
    const result = officeSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'name')).toBe(true);
  });

  test('郵便番号の形式が不正な場合エラーになる', () => {
    const result = officeSchema.safeParse({ name: '事業所A', postalCode: '12345' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path[0] === 'postalCode')).toBe(true);
  });

  test('任意項目（建物名・電話番号など）は空でもエラーにならない', () => {
    const result = officeSchema.safeParse({
      name: '事業所A',
      postalCode: '',
      address: '',
      building: '',
      phone: '',
    });
    expect(result.success).toBe(true);
  });
});
