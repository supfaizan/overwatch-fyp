import { api } from '@/shared/api/client';
import type {
  CheckResult,
  CheckSettings,
  CreateDecision,
  Decision,
  DecisionFields,
  DecisionFilters,
  DecisionPage,
  DecisionStatus,
  EvidenceKind,
  InboxCounts,
  NewEvidence,
} from './types';

/** How many decisions a list beside an item or page (or a picker) loads. */
export const LIST_LIMIT = 200;
/** How many decisions the inbox loads at a time, as it's scrolled. */
export const PAGE_SIZE = 30;

export const getDecisions = (filters: DecisionFilters) => {
  return api.get<Decision[]>('/decisions', { params: { ...filters, limit: LIST_LIMIT } });
};
/** One page of the inbox, newest change first. */
export const getDecisionPage = async (
  filters: DecisionFilters,
  offset: number,
): Promise<DecisionPage> => {
  const { data, meta } = await api.getWithMeta<Decision[]>('/decisions', {
    params: { ...filters, offset, limit: PAGE_SIZE },
  });
  return {
    decisions: data,
    total: typeof meta.total === 'number' ? meta.total : data.length,
    offset,
  };
};
export const getInboxCounts = (today: string) => {
  return api.get<InboxCounts>('/decisions/counts', { params: { today } });
};
export const getDecision = (id: string) => {
  return api.get<Decision>(`/decisions/${id}`);
};
export const createDecision = (body: CreateDecision) => {
  return api.post<Decision>('/decisions', body);
};
export const updateDecision = ({ id, ...body }: Partial<DecisionFields> & { id: string }) => {
  return api.patch<Decision>(`/decisions/${id}`, body);
};
export const changeStatus = (
  { id, ...body }: {
    id: string;
    status: DecisionStatus;
    note?: string;
    superseded_by?: string;
  },
) => {
  return api.post<Decision>(`/decisions/${id}/status`, body);
};
export const addEvidence = ({ id, ...body }: NewEvidence & { id: string }) => {
  return api.post<Decision>(`/decisions/${id}/evidence`, body);
};
export const removeEvidence = ({ id, evidenceId }: { id: string; evidenceId: string }) => {
  return api.delete<Decision>(`/decisions/${id}/evidence/${evidenceId}`);
};
/** The AI drafts the decisions an item or page states; they come back saved as proposals. */
export const suggestDecisions = (body: { kind: EvidenceKind; ref_id: string }) => {
  return api.post<Decision[]>('/decisions/suggest', body);
};
/** "Not a decision": removes a suggestion waiting for review so it isn't suggested again. */
export const dismissSuggestion = (id: string) => {
  return api.post<null>(`/decisions/${id}/dismiss`);
};

export const getCheckSettings = () => {
  return api.get<CheckSettings>('/decisions/checks');
};
export const changeCheckSettings = (
  body: Partial<Pick<CheckSettings, 'enabled' | 'interval_minutes'>>,
) => {
  return api.patch<CheckSettings>('/decisions/checks', body);
};
export const runCheck = () => {
  return api.post<CheckResult>('/decisions/checks/run');
};
