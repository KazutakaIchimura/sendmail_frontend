import type { Office } from './office';

export type User = {
  id: number;
  name: string;
  nameKana: string | null;
  birthDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserWithOffices = User & {
  offices: Office[];
};
