"use client";

import { useSyncExternalStore } from "react";

import { LiveAnnouncementBar } from "@/components/banner/LiveAnnouncementBar";
import { InlineScript } from "@/components/ui/InlineScript";
import {
  BANNER_ELEMENT_ID,
  bannerDismissScript,
  bannerVersion,
  isBannerDismissed,
  rememberBannerDismissed,
  subscribeBannerDismissed,
} from "@/lib/banner";
import type { Announcement } from "@/types";

const notDismissedOnServer = () => false;

/**
 * Storefront ticker with a close button, remembered per banner version.
 *
 * Rendered by a page as a sibling of <main>: `order-first` lifts it above the
 * sticky header in the body's flex column, so the header still sticks to the
 * viewport top once the ticker scrolls away.
 *
 * No flash for visitors who dismissed it: on full loads the inline script hides
 * the wrapper before first paint; on client navigations the store reads
 * localStorage directly.
 */
export function DismissibleAnnouncement({ announcement }: { announcement: Announcement }) {
  const version = bannerVersion(announcement);
  const dismissed = useSyncExternalStore(
    subscribeBannerDismissed,
    () => isBannerDismissed(version),
    notDismissedOnServer,
  );
  if (dismissed) return null;

  return (
    <>
      {/* The inline script may set `hidden` before hydration. */}
      <div id={BANNER_ELEMENT_ID} className="order-first" suppressHydrationWarning>
        <LiveAnnouncementBar announcement={announcement} onDismiss={() => rememberBannerDismissed(version)} />
      </div>
      <InlineScript html={bannerDismissScript(version)} />
    </>
  );
}
