import { client } from './client';
import type { MonitoringCycle, SaveMonitoringCycleRequest } from '@/types/monitoringCycle';

export const getSchedule = () =>
  client.get<MonitoringCycle[]>('/schedule').then(r => r.data);

export const getMonitoringCycle = (userId: number) =>
  client.get<MonitoringCycle>(`/users/${userId}/monitoring-cycle`).then(r => r.data);

export const saveMonitoringCycle = ({ userId, data }: { userId: number; data: SaveMonitoringCycleRequest }) =>
  client.put<MonitoringCycle>(`/users/${userId}/monitoring-cycle`, data).then(r => r.data);
