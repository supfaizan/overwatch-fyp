import { api } from '@/shared/api/client';
import type {
  AskBody,
  AskResult,
  Conversation,
  ConversationSummary,
  MentionCandidate,
} from './types';

export const ask = (body: AskBody) => {
  return api.post<AskResult>('/chat/ask', body);
};

export const getConversations = (repoFullName: string) => {
  return api.get<ConversationSummary[]>('/chat/conversations', {
    params: { repo_full_name: repoFullName },
  });
};

export const getConversation = (id: string) => {
  return api.get<Conversation>(`/chat/conversations/${encodeURIComponent(id)}`);
};

export const deleteConversation = (id: string) => {
  return api.delete<null>(`/chat/conversations/${encodeURIComponent(id)}`);
};

export const searchNodes = (repoFullName: string, q: string) => {
  return api.get<MentionCandidate[]>('/graph/search', {
    params: { repo_full_name: repoFullName, q, limit: 8 },
  });
};
