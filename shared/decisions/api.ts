import { api } from '@/shared/api/client';
import type {
  CreateDecision,
  Decision,
  DecisionFields,
  DecisionFilters,
  DecisionStatus,
  EvidenceKind,
  NewEvidence,
} from './types';

/** How many decisions a list loads; the inbox shows them all at once for now. */
export const LIST_LIMIT = 200;

export const getDecisions = (filters: DecisionFilters) => {
  return api.get<Decision[]>('/decisions', { params: { ...filters, limit: LIST_LIMIT } });
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
