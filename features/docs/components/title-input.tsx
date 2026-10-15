'use client';

import { useEffect, useRef, useState } from 'react';
import { useRenameDocument } from '../hooks';
import type { Document } from '../types';

const RENAME_DELAY = 600;

/** The page or folder title, renamed as it's typed (after a short pause) and on leaving the field. */
export default function TitleInput({ doc, onEnter }: { doc: Document; onEnter?: () => void }) {
  const [title, setTitle] = useState(doc.title);
  const rename = useRenameDocument();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saved = useRef(doc.title);

  const commit = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    if (next === saved.current) {
      return;
    }
    saved.current = next;
    rename.mutate({ id: doc.id, title: next });
  };

  useEffect(() => {
    return () => {
      return clearTimeout(timer.current);
    };
  }, []);

  return (
    <input
      value={title}
      onChange={(event) => {
        const { value } = event.target;
        setTitle(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          return commit(value);
        }, RENAME_DELAY);
      }}
      onBlur={() => {
        return commit(title);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit(title);
          onEnter?.();
        }
      }}
      readOnly={!doc.editable}
      maxLength={255}
      placeholder="Untitled"
      aria-label="Title"
      className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted/60"
    />
  );
}
