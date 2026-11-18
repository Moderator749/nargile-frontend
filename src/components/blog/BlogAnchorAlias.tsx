"use client";

import { useEffect } from "react";

import { currentBlogAnchor } from "@/lib/blogAnchors";

/**
 * On /blog: a link to a question (`#sss-<id>`) opens that question, and an old
 * anchor of a renamed question (lib/blogAnchors) is replaced by its current
 * one first, so bookmarks and outside links keep landing on the right answer.
 * Renders nothing.
 */
export function BlogAnchorAlias() {
  useEffect(() => {
    const land = () => {
      if (!window.location.hash) return;
      const target = currentBlogAnchor(window.location.hash);
      if (`#${target}` !== window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${target}`);
      }
      const el = document.getElementById(target);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    land();
    window.addEventListener("hashchange", land);
    return () => window.removeEventListener("hashchange", land);
  }, []);
  return null;
}
