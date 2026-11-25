"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AccessRestricted } from "@/components/layout/AccessRestricted";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

/**
 * "Grup Erişim Kısıtlamaları" for a signed-in visitor. The pages are rendered
 * as a guest sees them (the server has no token), so on every page change the
 * gate asks the API, with the visitor's token, whether their customer group
 * may open this address — a closed page, or a closed category's, brand's or
 * product's — and shows the notice in its place when not. A visitor who is not
 * signed in is turned away earlier, by src/proxy.ts. Either way the API itself
 * refuses the hidden data (app/services/tier_access): this only keeps a page's
 * frame from showing.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [closed, setClosed] = useState<string | null>(null);

  useEffect(() => {
    // Not signed in: the proxy has already decided. (`closed` names the path
    // it was set for, so a notice never outlives its page.)
    if (!getToken()) return;
    const controller = new AbortController();
    api
      .get<{ allowed: boolean }>("/access/check", { params: { path: pathname }, signal: controller.signal })
      .then(({ data }) => setClosed(data.allowed ? null : pathname))
      .catch(() => {
        // Unreachable: the page's own requests are refused by the API if they must be.
      });
    return () => controller.abort();
  }, [pathname]);

  return closed === pathname ? <AccessRestricted signedIn /> : <>{children}</>;
}
