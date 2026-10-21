import { notFound } from "next/navigation";

/**
 * An address no page answers, in any language: the shop's own 404
 * (app/[locale]/not-found.tsx), in the shop's chrome. With the root layout in
 * the [locale] segment there is no app-wide one, so this catches what falls
 * through.
 */
export default function Missing() {
  notFound();
}
