"use client";

import {
  Braces,
  FileCode2,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  MessagesSquare,
  Package,
  Shapes,
} from "lucide-react";
import type { ViewNodeLabel } from "../types";

/** The icon for a node, rendered as a component rather than picked into a
 *  variable, so nothing is constructed during render. */
export function NodeGlyph({
  label,
  kind,
  open,
  className,
}: {
  label: ViewNodeLabel;
  kind: string | null;
  /** A folder that is holding its contents open. */
  open?: boolean;
  className?: string;
}) {
  if (label === "Repository") return <GitBranch className={className} aria-hidden />;
  if (label === "Module") {
    if (kind === "external") return <Package className={className} aria-hidden />;
    if (kind === "routes") return <Globe className={className} aria-hidden />;
    if (kind === "channels") return <MessagesSquare className={className} aria-hidden />;
    return open ? (
      <FolderOpen className={className} aria-hidden />
    ) : (
      <Folder className={className} aria-hidden />
    );
  }
  if (label === "Package") return <Package className={className} aria-hidden />;
  if (label === "Route") return <Globe className={className} aria-hidden />;
  if (label === "Channel") return <MessagesSquare className={className} aria-hidden />;
  if (label === "File") return <FileCode2 className={className} aria-hidden />;
  if (kind === "class" || kind === "interface") {
    return <Shapes className={className} aria-hidden />;
  }
  return <Braces className={className} aria-hidden />;
}
