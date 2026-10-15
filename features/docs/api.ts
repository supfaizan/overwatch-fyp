import { api } from '@/shared/api/client';
import type { ArchivedDocument, ChildPage, ContentSave, CreateDocument, Document, UploadTarget } from './types';

/** How many of a folder's children load at a time. */
export const CHILD_PAGE_SIZE = 100;

export const getChildren = async (parentId: string | null, offset: number): Promise<ChildPage> => {
  const { data, meta } = await api.getWithMeta<ChildPage['nodes']>('/documents', {
    params: { ...(parentId && { parent_id: parentId }), offset, limit: CHILD_PAGE_SIZE },
  });
  return { nodes: data, total: typeof meta.total === 'number' ? meta.total : data.length, offset };
};

export const getDocument = (id: string) => api.get<Document>(`/documents/${id}`);
export const createDocument = (body: CreateDocument) => api.post<Document>('/documents', body);
export const renameDocument = ({ id, title }: { id: string; title: string }) => api.patch<Document>(`/documents/${id}`, { title });
export const saveContent = ({ id, ...body }: ContentSave & { id: string }) => api.patch<Document>(`/documents/${id}`, body);

/** What happens to what's inside: archived with it, or moved first (`move_to` null is the top level). */
export type ArchiveChoice = { children: 'archive' } | { children: 'move'; move_to: string | null };

export const archiveDocument = ({ id, ...choice }: ArchiveChoice & { id: string }) => api.post<null>(`/documents/${id}/archive`, choice);
export const restoreDocument = (id: string) => api.post<Document>(`/documents/${id}/restore`, {});

export const ARCHIVE_PAGE_SIZE = 50;

export const getArchived = async (offset: number) => {
  const { data, meta } = await api.getWithMeta<ArchivedDocument[]>('/documents/archived', { params: { offset, limit: ARCHIVE_PAGE_SIZE } });
  return { items: data, total: typeof meta.total === 'number' ? meta.total : data.length, offset };
};

/** Sends a file the way the backend described, so a storage provider change never touches this. */
async function send(target: UploadTarget, file: File) {
  if (target.via_api) {
    await api.request({ method: target.method, url: target.url, data: file, headers: target.headers });
    return;
  }
  const fields = Object.entries(target.fields);
  let body: BodyInit = file;
  if (fields.length) {
    const form = new FormData();
    fields.forEach(([name, value]) => form.append(name, value));
    form.append('file', file); // last: form uploads (S3) ignore fields after the file
    body = form;
  }
  const response = await fetch(target.url, { method: target.method, headers: target.headers, body });
  if (!response.ok) throw new Error("Couldn't upload the image. Try again.");
}

/** Uploads an image into a page and returns its link: straight to storage, then the backend checks what arrived. */
export async function uploadImage(pageId: string, file: File): Promise<{ id: string; url: string }> {
  const { id, upload } = await api.post<{ id: string; upload: UploadTarget }>(`/documents/${pageId}/attachments`, {
    filename: file.name || 'image', content_type: file.type, size: file.size,
  });
  await send(upload, file);
  return api.post<{ id: string; url: string }>(`/attachments/${id}/complete`, {});
}
