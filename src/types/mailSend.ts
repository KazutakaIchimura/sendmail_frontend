import type { Office } from './office';

export type SendType = 'PLAN' | 'MONITORING';
export type SendStatus = 'PENDING' | 'SENT' | 'DONE';

export type MailSend = {
  id: number;
  userId: number;
  userName: string;
  officeId: number;
  officeName: string;
  sendType: SendType;
  sendMonth: string;
  status: SendStatus;
  isOverdue: boolean;
  batchId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MailSendByOffice = {
  office: Office;
  mailSends: MailSend[];
};

export type MailSendBatch = {
  batchId: number;
  sentAt: string;
  updatedCount: number;
  notes?: string;
};
