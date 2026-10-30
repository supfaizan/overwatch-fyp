'use client';

import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { Paperclip, PaperPlaneRight } from '@phosphor-icons/react/ssr';
import { useRef, useState } from 'react';
import { matchShortcodes, replaceShortcodes, shortcodeQuery } from '../emoji';
import { ACCEPT } from '../files';
import { useDraftFiles, useShortcodes } from '../hooks';
import type { DiscussionAttachment } from '../types';
import { DraftFileChip } from './attachments';
import EmojiPicker from './emoji-picker';

/** The backend's limit on a message (app/comments/schemas.py BODY). */
export const MAX_MESSAGE = 20_000;

type ComposerProps = {
  decisionId: string;
  onSend: (body: string, attachments: DiscussionAttachment[]) => void;
  /** The draft changed: tells the others this member is typing. */
  onType?: (draft: string) => void;
  /** Sent or left: no longer typing. */
  onStopTyping?: () => void;
};

/**
 * Writing a message: Enter sends, Shift+Enter starts a new line; it grows with the text up to a
 * few lines. Emoji come from the picker, or by name: typing `:thu` suggests 👍 (arrows to choose,
 * Enter or Tab to pick), and a whole `:thumbsup:` becomes 👍 on send.
 */
export default function Composer({ decisionId, onSend, onType, onStopTyping }: ComposerProps) {
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const draftFiles = useDraftFiles(decisionId);
  const [dropping, setDropping] = useState(false);
  const uploading = draftFiles.files.some((draft) => {
    return draft.status !== 'ready';
  });
  const ready = draftFiles.files.flatMap((draft) => {
    return draft.attachment ? [draft.attachment] : [];
  });
  const [draft, setDraft] = useState('');
  const [caret, setCaret] = useState(0);
  // files still uploading (or failed) hold the send; files alone are enough to send
  const canSend = !uploading && (draft.trim().length > 0 || ready.length > 0);
  const [chosen, setChosen] = useState(0);
  // Esc closes the suggestions for the name being typed, until another is started
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  // names load once someone first types a ":"
  const shortcodes = useShortcodes(draft.includes(':'));
  const typed = shortcodeQuery(draft, caret);
  const query = typed && typed.start !== dismissedAt ? typed : null;
  const suggestions = query && shortcodes.data ? matchShortcodes(shortcodes.data, query.query) : [];

  const update = (text: string, at: number) => {
    setDraft(text);
    setCaret(at);
    setChosen(0);
    onType?.(text);
  };

  /** Put `text` in place of the draft from `start` to the caret, and move the caret after it. */
  const insert = (text: string, start = caret) => {
    const next = `${draft.slice(0, start)}${text}${draft.slice(caret)}`;
    const at = start + text.length;
    update(next, at);
    requestAnimationFrame(() => {
      field.current?.focus();
      field.current?.setSelectionRange(at, at);
    });
  };

  const submit = () => {
    const byName = new Map(
      shortcodes.data?.map((shortcode) => {
        return [shortcode.name, shortcode.emoji];
      }),
    );
    const body = replaceShortcodes(draft, byName).trim();
    if (canSend) {
      onSend(body, ready);
      update('', 0);
      draftFiles.clear();
      onStopTyping?.();
    }
  };

  return (
    <form
      className={cn(
        'relative flex flex-col gap-2 border-t border-border p-3',
        dropping && 'bg-primary/5 outline-2 -outline-offset-4 outline-primary outline-dashed',
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDropping(true);
        }
      }}
      onDragLeave={(event) => {
        // leaving for a child of the form isn't leaving
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
          setDropping(false);
        }
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files.length > 0) {
          event.preventDefault();
          draftFiles.add(Array.from(event.dataTransfer.files));
        }
        setDropping(false);
      }}
    >
      {draftFiles.files.length > 0 && (
        <ul aria-label="Files to send" className="flex flex-wrap gap-2">
          {draftFiles.files.map((file) => {
            return (
              <DraftFileChip
                key={file.key}
                draft={file}
                onRetry={() => {
                  return draftFiles.retry(file);
                }}
                onRemove={() => {
                  return draftFiles.remove(file.key);
                }}
              />
            );
          })}
        </ul>
      )}
      <div className="flex items-end gap-1">
        {suggestions.length > 0 && query && (
          <ul
            id="emoji-suggestions"
            role="listbox"
            aria-label="Emoji"
            className="absolute right-3 bottom-full left-3 mb-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-chrome shadow-border"
          >
            {suggestions.map((shortcode, index) => {
              return (
                <li
                  key={shortcode.name}
                  id={`emoji-suggestion-${index}`}
                  role="option"
                  aria-selected={index === chosen}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm',
                    index === chosen && 'bg-fill-hover',
                  )}
                  // mousedown, so the textarea keeps focus
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insert(`${shortcode.emoji} `, query.start);
                  }}
                >
                  <span className="text-base">{shortcode.emoji}</span>
                  <span className="text-muted">:{shortcode.name}:</span>
                </li>
              );
            })}
          </ul>
        )}
        <textarea
          ref={field}
          aria-label="Message"
          aria-autocomplete="list"
          aria-controls={suggestions.length > 0 ? 'emoji-suggestions' : undefined}
          aria-activedescendant={suggestions.length > 0 ? `emoji-suggestion-${chosen}` : undefined}
          placeholder="Write a message…"
          rows={1}
          maxLength={MAX_MESSAGE}
          className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary"
          value={draft}
          onChange={(event) => {
            update(event.target.value, event.target.selectionStart);
          }}
          onSelect={(event) => {
            setCaret(event.currentTarget.selectionStart);
          }}
          onBlur={onStopTyping}
          onPaste={(event) => {
            // pasted files (a screenshot) are attached; pasted text pastes as usual
            if (event.clipboardData.files.length > 0) {
              event.preventDefault();
              draftFiles.add(Array.from(event.clipboardData.files));
            }
          }}
          onKeyDown={(event) => {
            // not while an input method is composing a character: its keys pick the character
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (suggestions.length > 0 && query) {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const step = event.key === 'ArrowDown' ? 1 : -1;
                setChosen((chosen + step + suggestions.length) % suggestions.length);
                return;
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                insert(`${suggestions[chosen].emoji} `, query.start);
                return;
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setDismissedAt(query.start);
                return;
              }
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <input
          ref={picker}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            draftFiles.add(Array.from(event.target.files ?? []));
            // the same file can be picked again after removing it
            event.target.value = '';
          }}
        />
        <Tooltip content="Attach files">
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            aria-label="Attach files"
            onClick={() => {
              return picker.current?.click();
            }}
          >
            <Paperclip aria-hidden />
          </Button>
        </Tooltip>
        <EmojiPicker
          label="Add emoji"
          onPick={(emoji) => {
            return insert(emoji);
          }}
        />
        <Tooltip content={uploading ? 'Waiting for files to finish uploading' : 'Send'}>
          <Button type="submit" variant="primary" iconOnly aria-label="Send" disabled={!canSend}>
            <PaperPlaneRight aria-hidden />
          </Button>
        </Tooltip>
      </div>
    </form>
  );
}
