import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function EmptyCart() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <ShoppingBag className="h-9 w-9" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="mt-6 text-xl font-bold tracking-tight">Sepetiniz boş</h2>
      <p className="mt-2 text-sm text-slate-500">
        Katalogdaki ürünlere göz atın, beğendiklerinizi sepete ekleyin.
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
      >
        Kataloğa göz at
      </Link>
    </div>
  );
}
