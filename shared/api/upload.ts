import axios from 'axios';
import { api } from './client';

/** How the backend says to send a file; followed as given, so a storage provider change never touches the frontend. */
export type UploadTarget = {
  method: string;
  url: string;
  /** form fields to send before the file; empty for a PUT */
  fields: Record<string, string>;
  headers: Record<string, string>;
  /** the URL is our API (dev), which needs the user's login; otherwise it's the storage provider */
  via_api: boolean;
};

// straight to storage: a plain client, so the user's login never goes to the provider
const storage = axios.create();

/** Send a file where the backend said, reporting how much is sent (0 to 1) as it goes. */
export async function sendUpload(
  target: UploadTarget,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const progress = onProgress && {
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      return onProgress(event.total ? event.loaded / event.total : 0);
    },
  };
  if (target.via_api) {
    await api.request({
      method: target.method,
      url: target.url,
      data: file,
      headers: target.headers,
      ...progress,
    });
    return;
  }
  const fields = Object.entries(target.fields);
  let body: Blob | FormData = file;
  if (fields.length) {
    const form = new FormData();
    fields.forEach(([name, value]) => {
      return form.append(name, value);
    });
    form.append('file', file); // last: form uploads (S3) ignore fields after the file
    body = form;
  }
  try {
    await storage.request({
      method: target.method,
      url: target.url,
      headers: target.headers,
      data: body,
      ...progress,
    });
  } catch {
    throw new Error("Couldn't upload the file. Try again.");
  }
}
