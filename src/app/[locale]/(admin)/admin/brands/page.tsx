import { redirect } from "next/navigation";

/** "Markalar" is a tab of "Ürünler & Stok" now: old links and bookmarks lead there. */
export default function Page() {
  redirect("/admin/products?sekme=markalar");
}
