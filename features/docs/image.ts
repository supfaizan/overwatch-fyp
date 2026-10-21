import { mergeAttributes, Node, ReactNodeViewRenderer } from '@tiptap/react';
import ImageView, { IMAGE_CONTROL } from './components/image-view';
import { clampImageWidth, markdownAlt } from './lib';

/**
 * An image in a page. An uploaded one keeps its `attachmentId`, the lasting reference; its `src` is a
 * signed link that expires and is swapped for a fresh one each time the page loads (`withImageLinks`).
 * While it uploads, `uploadId` marks it and `src` is a local preview. An image copied from a page's
 * source keeps the source's original in `raw`, so it goes back there as it came. `width` is a percent of the
 * page column (null: its own size, capped at the column); `ImageView` resizes it and edits its alt text.
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
        parseHTML: (element) => {
          return element.getAttribute('data-attachment-id');
        },
        renderHTML: (
          attrs,
        ) => {
          return (attrs.attachmentId ? { 'data-attachment-id': attrs.attachmentId } : {});
        },
      },
      uploadId: {
        default: null,
        renderHTML: (attrs) => {
          return (attrs.uploadId ? { 'data-uploading': '' } : {});
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = Number(element.getAttribute('data-width'));
          return width ? clampImageWidth(width) : null;
        },
        renderHTML: (attrs) => {
          return (attrs.width ? { 'data-width': attrs.width, style: `width:${attrs.width}%` } : {});
        },
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
      ) => {
        return (/^https?:\/\//i.test(element.getAttribute('src') ?? '') ? null : false);
      },
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { loading: 'lazy' })];
  },

  // the handles and the "…" menu handle their own pointer events; the editor would select or drag instead
  addNodeView() {
    return ReactNodeViewRenderer(ImageView, {
      stopEvent: ({ event }) => {
        return event.target instanceof Element
          && Boolean(event.target.closest(`[${IMAGE_CONTROL}]`));
      },
    });
  },

  renderMarkdown: (node) => {
    const { alt, attachmentId, src } = node.attrs ?? {};
    return `![${markdownAlt(alt ?? null)}](${
      attachmentId ? `attachment:${attachmentId}` : (src ?? '')
    })`;
  },
});
