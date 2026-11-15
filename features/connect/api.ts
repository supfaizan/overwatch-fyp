import { api } from '@/shared/api/client';

/** A sign-in an AI tool started, waiting for the member's answer. */
export type PendingConnection = {
  id: string;
  client_name: string;
  /** where the browser goes back to once answered */
  redirect_host: string;
  /** the tool runs on this machine, so it goes back to a local address */
  on_this_device: boolean;
};

/** The tool's address to send the browser to, carrying the answer. */
type Answered = { redirect_to: string };

export const getPendingConnection = (requestId: string) => {
  return api.get<PendingConnection>(`/oauth/requests/${requestId}`);
};

export const approveConnection = (
  { requestId, workspaceId, readOnly, askFirst }: {
    requestId: string;
    workspaceId: string;
    readOnly: boolean;
    askFirst: boolean;
  },
) => {
  return api.post<Answered>(`/oauth/requests/${requestId}/approve`, {
    workspace_id: workspaceId,
    read_only: readOnly,
    ask_first: askFirst,
  });
};

export const denyConnection = (requestId: string) => {
  return api.post<Answered>(`/oauth/requests/${requestId}/deny`);
};
