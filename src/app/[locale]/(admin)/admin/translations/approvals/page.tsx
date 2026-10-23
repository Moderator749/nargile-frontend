import { redirect } from "next/navigation";

/** The approvals are a tab of "Çeviriler": a link to them by this address leads there. */
export default function Page() {
  redirect("/admin/translations?sekme=onaylar");
}
