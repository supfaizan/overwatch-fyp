import { api } from '@/shared/api/client';
import type { CheckResult, CheckSettings } from './types';

export const getCheckSettings = () => {
  return api.get<CheckSettings>('/decisions/checks');
};
export const setChecksEnabled = (enabled: boolean) => {
  return api.put<CheckSettings>('/decisions/checks', { enabled });
};
export const runCheck = () => {
  return api.post<CheckResult>('/decisions/checks/run');
};
