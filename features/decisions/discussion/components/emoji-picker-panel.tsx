'use client';

import {
  EmojiPicker,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from 'frimousse';

function CategoryHeader({ category, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div className="bg-surface px-3 pt-3 pb-1.5 text-xs font-medium text-muted" {...props}>
      {category.label}
    </div>
  );
}

function Row({ children, ...props }: EmojiPickerListRowProps) {
  return <div className="scroll-my-1.5 px-1.5" {...props}>{children}</div>;
}

function Emoji({ emoji, ...props }: EmojiPickerListEmojiProps) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-md text-lg data-active:bg-fill-hover"
      {...props}
    >
      {emoji.emoji}
    </button>
  );
}

/** The picker itself (frimousse), loaded only once a picker is opened. */
export default function EmojiPickerPanel({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker.Root
      className="isolate flex h-80 w-72 flex-col"
      columns={8}
      onEmojiSelect={({ emoji }) => {
        return onPick(emoji);
      }}
    >
      <EmojiPicker.Search
        aria-label="Search emoji"
        placeholder="Search emoji…"
        className="z-10 mx-2 mt-2 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm outline-none placeholder:text-muted focus:border-primary"
      />
      <EmojiPicker.Viewport className="relative flex-1 outline-none">
        <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          Loading…
        </EmojiPicker.Loading>
        <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          No emoji found.
        </EmojiPicker.Empty>
        <EmojiPicker.List
          className="pb-1.5 select-none"
          components={{ CategoryHeader, Row, Emoji }}
        />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}
