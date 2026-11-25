import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { B2BApplicationsPanel } from "@/components/admin/B2BApplicationsPanel";
import { AdminCustomersGrid } from "@/components/admin/customers/AdminCustomersGrid";
import { CustomerDeletedNotice } from "@/components/admin/customers/CustomerDeletedNotice";

export const metadata: Metadata = { title: "Müşteriler" };

export default function Page() {
  return (
    <>
      <AdminPageHeader
        title="Müşteriler"
        description="Kayıtlı tüm hesaplar. Bir müşteriye tıklayın: kimlik, fatura ve adres bilgilerini görün, fiyat grubunu tanımlayın, Sultan Puan düzeltin."
      />
      {/* After "Kalıcı Olarak Sil" on a customer's page: what was done. */}
      <Suspense fallback={null}>
        <CustomerDeletedNotice />
      </Suspense>
      {/* The applications queue first: it is the only thing here with a decision
          waiting on it. */}
      <B2BApplicationsPanel />
      <AdminCustomersGrid />
    </>
  );
}
