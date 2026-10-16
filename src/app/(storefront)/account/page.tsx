import type { Metadata } from "next";

import { AccountView } from "@/components/account/AccountView";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hesabım",
  description: "Sultan Puan bakiyeniz, yıllık bonus hedefiniz, puan geçmişiniz ve hesap bilgileriniz.",
  robots: PRIVATE_ROBOTS,
};

export default function AccountPage() {
  return <AccountView />;
}
