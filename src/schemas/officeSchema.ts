import { z } from 'zod';

export const OFFICE_TYPES = [
  '共同生活援助（グループホーム）',
  '就労継続支援A型',
  '就労継続支援B型',
  '就労移行支援',
  '生活介護',
  '自立訓練（機能訓練）',
  '自立訓練（生活訓練）',
  '放課後等デイサービス',
  '居宅介護',
  '重度訪問介護',
  '短期入所',
  '療養介護',
  '施設入所支援',
  '児童発達支援',
  '計画相談支援',
  '障害児相談支援',
  'その他',
] as const;

export const officeSchema = z.object({
  name: z.string()
    .min(1, '事業所名を入力してください')
    .max(200, '事業所名は200文字以内で入力してください'),
  officeType: z.string().optional().or(z.literal('')),
  postalCode: z.string()
    .regex(/^\d{3}-?\d{4}$/, '郵便番号は数字7桁で入力してください（例：123-4567）')
    .optional().or(z.literal('')),
  address: z.string().max(200, '住所は200文字以内で入力してください').optional(),
  building: z.string().max(200, '建物名は200文字以内で入力してください').optional(),
  phone: z.string()
    .regex(/^[\d\-\+\(\)\s]*$/, '電話番号は数字とハイフンで入力してください（例：03-0000-0000）')
    .optional().or(z.literal('')),
});
export type OfficeForm = z.infer<typeof officeSchema>;
