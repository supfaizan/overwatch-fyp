import { mergeAttributes, Node } from '@tiptap/react';

/**
 * An image in a page. An uploaded one keeps its `attachmentId`, the lasting reference; its `src` is a
 * signed link that expires and is swapped for a fresh one each time the page loads (`withImageLinks`).
 * While it uploads, `uploadId` marks it and `src` is a local preview. An image copied from a page's
 * source keeps the source's original in `raw`, so it goes back there as it came.
 */
export const DocImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (
          attrs,
        ) => (attrs.attachmentId ? { 'data-attachment-id': attrs.attachmentId } : {}),
      },
      uploadId: {
        default: null,
        renderHTML: (attrs) => (attrs.uploadId ? { 'data-uploading': '' } : {}),
      },
      raw: { default: null, rendered: false },
    };
  },

  // an image pasted from a web page keeps its address; only web addresses, never scripts
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (
        element,
      ) => (/^https?:\/\//i.test(element.getAttribute('src') ?? '') ? null : false),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { loading: 'lazy' })];
  },

  renderMarkdown: (node) => {
    const { alt, attachmentId, src } = node.attrs ?? {};
    return `![${alt ?? ''}](${attachmentId ? `attachment:${attachmentId}` : (src ?? '')})`;
  },
});
