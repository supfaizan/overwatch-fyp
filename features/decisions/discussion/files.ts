/** The files a discussion takes, mirroring the backend (app/decision_comments/attachments.py). */
export const ALLOWED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'txt',
  'md',
  'csv',
  'json',
] as const;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 10;

/** For the file picker's `accept`. */
export const ACCEPT = ALLOWED_EXTENSIONS.map((extension) => {
  return `.${extension}`;
}).join(',');

/** Why a file can't be added, before it's uploaded; null when it can (the backend checks again). */
export function fileProblem(name: string, size: number): string | null {
  const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined;
  if (
    !extension || !ALLOWED_EXTENSIONS.some((allowed) => {
      return allowed === extension;
    })
  ) {
    return `${name} can't be shared: only ${ALLOWED_EXTENSIONS.join(', ')} files.`;
  }
  if (size > MAX_FILE_BYTES) {
    return `${name} is over ${formatBytes(MAX_FILE_BYTES)}.`;
  }
  return null;
}

/** A file size as people read it: "820 B", "14 KB", "3.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
