"use client";

import {
  Braces,
  FileCode2,
  Folder,
  FolderOpen,
  Globe,
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
  if (label === "Module") {
    if (kind === "external") return <Package className={className} aria-hidden />;
    if (kind === "routes") return <Globe className={className} aria-hidden />;
    return open ? (
      <FolderOpen className={className} aria-hidden />
    ) : (
      <Folder className={className} aria-hidden />
    );
  }
  if (label === "Package") return <Package className={className} aria-hidden />;
  if (label === "Route") return <Globe className={className} aria-hidden />;
  if (label === "File") return <FileCode2 className={className} aria-hidden />;
  if (kind === "class" || kind === "interface") {
    return <Shapes className={className} aria-hidden />;
  }
  return <Braces className={className} aria-hidden />;
}
