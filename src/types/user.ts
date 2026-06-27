import type { Office } from './office';

export type User = {
  id: number;
  name: string;
  nameKana: string | null;
  birthDate: string | null;
  notes: string | null;
  recipientNumber: string | null;
  disabilitySupportCategory: string | null;
  isActive: boolean;
  assignedStaffId: number | null;
  assignedStaffName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserWithOffices = User & {
  offices: Office[];
};
