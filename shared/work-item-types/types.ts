// mirrors the backend (app/work_item_types)

/** The icons a type can have: Phosphor icon names, the same list the backend accepts. */
export const TYPE_ICONS = [
  'CheckSquare', 'Bug', 'Flask', 'BookmarkSimple', 'Lightning', 'TreeStructure', 'Star', 'Flag', 'Wrench', 'Rocket', 'Lightbulb',
  'ShieldCheck', 'Gear', 'PaintBrush', 'FileText', 'Megaphone', 'Question', 'Target', 'PuzzlePiece', 'Code', 'Circle',
] as const;
export type TypeIcon = (typeof TYPE_ICONS)[number];

export const TYPE_COLORS = ['gray', 'blue', 'green', 'red', 'amber', 'purple', 'orange', 'slate'] as const;
export type TypeColor = (typeof TYPE_COLORS)[number];

export type WorkItemType = {
  id: string;
  name: string;
  icon: TypeIcon;
  color: TypeColor;
  /** `native` for the workspace's own; a tracker's provider for its types, whose names it owns */
  source: string;
  created_at: string;
};

export type TypeFields = { name: string; icon: TypeIcon; color: TypeColor };
