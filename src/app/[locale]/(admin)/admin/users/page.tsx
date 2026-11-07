import { AdminUsersView } from "@/components/admin/AdminUsersView";

// No title of its own: the panel's default ("Yönetim") says nothing to an admin who types the address.
export default function Page() {
  return <AdminUsersView />;
}
