"use client";

import { useRef, useState, type DragEvent } from "react";

/**
 * Drag & drop plumbing for an upload zone: the highlight state and the handlers
 * to spread onto the drop target.
 *
 * dragenter/leave also fire for child elements, so the depth is counted — the
 * highlight would otherwise flicker as the pointer crosses the zone's contents.
 */
export function useFileDrop({ onFiles, disabled = false }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return {
    /** True while files are being dragged over an enabled zone. */
    over: over && !disabled,
    handlers: {
      onDragEnter(e: DragEvent) {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      },
      onDragOver(e: DragEvent) {
        if (!hasFiles(e)) return;
        e.preventDefault(); // required to allow dropping
        e.dataTransfer.dropEffect = disabled ? "none" : "copy";
      },
      onDragLeave() {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      },
      onDrop(e: DragEvent) {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      },
    },
  };
}
