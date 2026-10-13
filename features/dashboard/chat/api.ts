import { api } from '@/shared/api/client';
import type { AskBody, AskResult, Conversation, ConversationSummary, MentionCandidate } from './types';

export const ask = (body: AskBody) => api.post<AskResult>('/chat/ask', body);

export const getConversations = (repoFullName: string) =>
  api.get<ConversationSummary[]>('/chat/conversations', { params: { repo_full_name: repoFullName } });

export const getConversation = (id: string) => api.get<Conversation>(`/chat/conversations/${encodeURIComponent(id)}`);

export const deleteConversation = (id: string) => api.delete<null>(`/chat/conversations/${encodeURIComponent(id)}`);

export const searchNodes = (repoFullName: string, q: string) =>
  api.get<MentionCandidate[]>('/graph/search', { params: { repo_full_name: repoFullName, q, limit: 8 } });
