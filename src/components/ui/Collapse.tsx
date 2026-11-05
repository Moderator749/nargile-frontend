"use client";

import { useState, type ReactNode } from "react";

/**
 * A part of a form that opens and closes by sliding, not by jumping.
 *
 * The height animates through the grid row (0fr → 1fr), which needs no
 * measuring. Closed, it is `inert` — nothing in it can be focused or clicked —
 * and once the closing slide has finished its content is taken out of the
 * page altogether; the values live in the form's state, not in these inputs,
 * so nothing typed is lost. While it slides the content is clipped; once open
 * it is not, so a field's focus ring is not cut off at the edge.
 */
export function Collapse({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [settled, setSettled] = useState(open);
  // Adjusting state while rendering, as React suggests for state that follows
  // a prop: the content has to be there in the same frame the row starts to grow.
  if (open && !mounted) setMounted(true);
  if (!open && settled) setSettled(false);

  return (
    <div
      id={id}
      inert={!open}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget || e.propertyName !== "grid-template-rows") return;
        if (open) setSettled(true);
        else setMounted(false);
      }}
      // 1ms rather than none for reduced motion, so the transition still ends.
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:duration-[1ms] ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className={`min-h-0 ${open && settled ? "" : "overflow-hidden"}`}>{mounted && children}</div>
    </div>
  );
}
