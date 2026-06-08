import { z } from 'zod';

export const officeSchema = z.object({
  name: z.string()
    .min(1, '事業所名を入力してください')
    .max(200, '事業所名は200文字以内で入力してください'),
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
