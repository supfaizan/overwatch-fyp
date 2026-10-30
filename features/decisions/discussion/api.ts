import { api } from '@/shared/api/client';
import { sendUpload, type UploadTarget } from '@/shared/api/upload';
import type { DiscussionAttachment, DiscussionMessage, DiscussionPage } from './types';

const base = (decisionId: string) => {
  return `/decisions/${decisionId}/comments`;
};

/** The messages before `before` (the newest when null), oldest first. */
export const getMessages = async (
  decisionId: string,
  before: string | null,
): Promise<DiscussionPage> => {
  const { data, meta } = await api.getWithMeta<DiscussionMessage[]>(base(decisionId), {
    params: before ? { before } : {},
  });
  return { messages: data, hasMore: meta.has_more === true };
};

/** Sent again with the same `clientId`, the backend answers with the message already posted. */
export const sendMessage = (
  { decisionId, clientId, body, attachmentIds }: {
    decisionId: string;
    clientId: string;
    body: string;
    attachmentIds: string[];
  },
) => {
  return api.post<DiscussionMessage>(base(decisionId), {
    client_id: clientId,
    body,
    attachment_ids: attachmentIds,
  });
};

/** Uploads a file to send in the discussion: straight to storage, then the backend checks what arrived. */
export async function uploadAttachment(
  decisionId: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<DiscussionAttachment> {
  const { id, upload } = await api.post<{ id: string; upload: UploadTarget }>(
    `/decisions/${decisionId}/attachments`,
    { filename: file.name || 'file', size: file.size },
  );
  await sendUpload(upload, file, onProgress);
  return api.post<DiscussionAttachment>(`/decision-attachments/${id}/complete`, {});
}

/** A link that downloads the file, good for a couple of minutes. */
export const getDownloadLink = (attachmentId: string) => {
  return api.get<{ url: string }>(`/decision-attachments/${attachmentId}/download`);
};

export const editMessage = (
  { decisionId, id, body }: { decisionId: string; id: string; body: string },
) => {
  return api.patch<DiscussionMessage>(`${base(decisionId)}/${id}`, { body });
};

export const deleteMessage = ({ decisionId, id }: { decisionId: string; id: string }) => {
  return api.delete<null>(`${base(decisionId)}/${id}`);
};

/** Add or take off the caller's reaction; either way the backend answers with the message as it now is. */
export const setReaction = (
  { decisionId, id, emoji, on }: { decisionId: string; id: string; emoji: string; on: boolean },
) => {
  const url = `${base(decisionId)}/${id}/reactions/${encodeURIComponent(emoji)}`;
  return on
    ? api.request<DiscussionMessage>({ method: 'PUT', url })
    : api.delete<DiscussionMessage>(url);
};
