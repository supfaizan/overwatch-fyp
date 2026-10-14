import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/envelope';
import { uploadImage } from './api';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './lib';

/**
 * Puts images into a page at once (a local preview, dimmed), uploads them side by side, then swaps
 * each preview for its stored image; the change autosaves like any edit. A failed upload is removed.
 */
export function insertImages(editor: Editor, pageId: string, files: File[], at?: number) {
  const images = files.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES);
  if (images.length < files.length) toast.error('Only PNG, JPEG, GIF or WebP images up to 10 MB can be added.');
  if (!images.length) return;

  const uploads = images.map((file) => ({ file, uploadId: crypto.randomUUID(), preview: URL.createObjectURL(file) }));
  const nodes = uploads.map(({ file, uploadId, preview }) => ({ type: 'image', attrs: { src: preview, alt: file.name, uploadId } }));
  editor.chain().focus().insertContentAt(at ?? editor.state.selection.to, nodes).run();

  for (const { file, uploadId, preview } of uploads) {
    uploadImage(pageId, file)
      .then(({ id, url }) => update(editor, uploadId, (tr, pos, attrs) => tr.setNodeMarkup(pos, undefined, { ...attrs, src: url, attachmentId: id, uploadId: null })))
      .catch((error: unknown) => {
        update(editor, uploadId, (tr, pos, _, size) => tr.delete(pos, pos + size));
        toast.error(toApiError(error).message);
      })
      .finally(() => URL.revokeObjectURL(preview));
  }
}

type Change = (tr: Editor['state']['tr'], pos: number, attrs: Record<string, unknown>, size: number) => Editor['state']['tr'];

/** Changes the image still waiting on this upload, wherever it's been moved to since. */
function update(editor: Editor, uploadId: string, change: Change) {
  if (editor.isDestroyed) return;
  let found: { pos: number; attrs: Record<string, unknown>; size: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === 'image' && node.attrs.uploadId === uploadId) found = { pos, attrs: node.attrs, size: node.nodeSize };
    return !found;
  });
  if (!found) return;
  const { pos, attrs, size } = found;
  editor.view.dispatch(change(editor.state.tr, pos, attrs, size));
}
