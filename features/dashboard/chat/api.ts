import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/envelope';
import { type AskStreamEvent, parseServerSent } from './lib';
import type {
  AskBody,
  AskResult,
  Conversation,
  ConversationSummary,
  MentionCandidate,
  SourceFile,
} from './types';

/**
 * Ask, receiving the answer as it's written. `onEvent` gets each piece; resolves with the saved
 * question and checked answer, or rejects with an `ApiError`.
 */
export async function askStream(
  body: AskBody,
  { signal, onEvent }: { signal?: AbortSignal; onEvent: (event: AskStreamEvent) => void },
): Promise<AskResult> {
  const stream = await api.stream('/chat/ask/stream', body, { signal });
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const { events, rest } = parseServerSent(buffer + value);
    buffer = rest;
    for (const event of events) {
      if (event.event === 'error') {
        throw new ApiError(event.data.message, 502, event.data.error_code);
      }
      onEvent(event);
      if (event.event === 'done') {
        return event.data;
      }
    }
  }
  throw new ApiError('The answer was cut off. Try again.', 502, 'stream_ended');
}

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

export const getSource = (repoFullName: string, path: string, commitSha: string) => {
  return api.get<SourceFile>('/graph/source', {
    params: { repo_full_name: repoFullName, path, commit_sha: commitSha },
  });
};
