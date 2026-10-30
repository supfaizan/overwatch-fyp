/** What a ⌘K search result opens: a board item, or a docs page. */
export const SEARCH_RESULT_KIND = { workItem: 'work_item', document: 'document' } as const;
export type SearchResultKind = (typeof SEARCH_RESULT_KIND)[keyof typeof SEARCH_RESULT_KIND];

export type SearchResult = {
  kind: SearchResultKind;
  id: string;
  title: string;
  /** where it's mirrored from ("jira", "confluence"...), or "native" */
  source: string;
  /** a board item's key, and the board it opens on */
  key: string | null;
  board_id: string | null;
  /** the text around the match, when it was found in the body rather than the key or title */
  snippet: string | null;
};
