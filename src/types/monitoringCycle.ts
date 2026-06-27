export type MonitoringCycle = {
  userId: number;
  userName: string;
  userNameKana: string | null;
  assignedStaffId: number | null;
  assignedStaffName: string | null;
  cycleMonths: number | null;
  nextMonitoringDate: string | null;
  nextPlanDraftDate: string | null;
  nextPlanDate: string | null;
  notes: string | null;
};

export type SaveMonitoringCycleRequest = {
  cycleMonths: number;
  nextMonitoringDate: string | null;
  nextPlanDraftDate: string | null;
  nextPlanDate: string | null;
  notes: string | null;
};
