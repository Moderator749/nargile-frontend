import type { Metadata } from "next";

import { AdminBankAccountsView } from "@/components/admin/AdminBankAccountsView";

export const metadata: Metadata = { title: "Banka Hesapları" };

export default function Page() {
  return <AdminBankAccountsView />;
}
