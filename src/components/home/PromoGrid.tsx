import { PromoCardView } from "@/components/home/PromoCardView";
import { PromoSocialCard } from "@/components/home/PromoSocialCard";
import type { PromoBox } from "@/lib/home";

/**
 * Three to a row from `md` up, whatever the row holds.
 *
 * Thirds from `md` rather than `lg`: the category column takes 16rem out of
 * the width from `lg` up, so a grid that waited for `lg` to go three-up spent
 * the whole desktop range at two — which is exactly how it looked. Below `md`
 * the column is a drawer and the grid has the width to itself, so two there,
 * one on a phone.
 *
 * A row holding two boxes leaves the third place empty, which is the point: the
 * shape of a row does not change with how much is in it.
 */
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3";

/** Modules 6 & 7: a row of up to 3 feature cards; pass only the visible boxes. */
export function PromoGrid({ boxes, label }: { boxes: PromoBox[]; label: string }) {
  if (boxes.length === 0) return null;

  return (
    <section aria-label={label}>
      <ul className={GRID}>
        {boxes.map((box) => (
          <li key={box.id} className="flex">
            {box.variant === "social" ? <PromoSocialCard box={box} /> : <PromoCardView box={box} />}
          </li>
        ))}
      </ul>
    </section>
  );
}
