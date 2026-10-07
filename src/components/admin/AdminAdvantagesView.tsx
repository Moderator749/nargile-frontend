"use client";

import { ContentEditor } from "@/components/admin/ContentEditor";
import { Input } from "@/components/ui/Input";
import { adminAdvantages } from "@/lib/adminApi";
import { ADVANTAGE_ICONS } from "@/lib/advantageIcons";
import type { AdvantageContent, AdvantageWrite } from "@/types";

const MAX_DETAILS = 6;

const blank = (): AdvantageWrite => ({
  icon: "badge-check",
  title: "",
  highlight: "",
  highlight_label: "",
  details: [],
  footnote: null,
  is_active: true,
  sort_order: 100,
});

const toWrite = (a: AdvantageContent): AdvantageWrite => ({
  icon: a.icon,
  title: a.title,
  highlight: a.highlight,
  highlight_label: a.highlight_label,
  details: a.details,
  footnote: a.footnote,
  is_active: a.is_active,
  sort_order: a.sort_order,
});

function validate(v: AdvantageWrite): string | null {
  if (!v.title.trim() || !v.highlight.trim()) return "Başlık ve öne çıkan değer gerekli.";
  if (v.details.filter((d) => d.trim()).length > MAX_DETAILS) return `En fazla ${MAX_DETAILS} detay satırı.`;
  return null;
}

/** Admin: the "Avantajlar" bento (cargo, courier, installments, transfer discount, ParaPuan…). */
export function AdminAdvantagesView() {
  return (
    <ContentEditor
      title="Avantajlar"
      description="Ana sayfadaki avantaj kutuları. İlk sıradaki büyük gösterilir. Metinleri sepet kurallarıyla tutarlı tutun."
      noun="avantaj"
      api={adminAdvantages}
      blank={blank}
      toWrite={toWrite}
      summary={(a) => ({ primary: a.title, secondary: `${a.highlight} ${a.highlight_label}`.trim() })}
      validate={validate}
      listNote="Not: Kargo, havale indirimi ve ParaPuan sepette uygulanır; kurye ve taksit bilgilendirme amaçlıdır."
      fields={(v, set) => {
        const Icon = ADVANTAGE_ICONS[v.icon]?.icon;
        return (
          <>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">Simge</legend>
              <div role="radiogroup" aria-label="Simge" className="mt-2 grid grid-cols-6 gap-2">
                {Object.entries(ADVANTAGE_ICONS).map(([key, { icon: I, label }]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={v.icon === key}
                    aria-label={label}
                    title={label}
                    onClick={() => set({ icon: key })}
                    className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                      v.icon === key
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:text-zinc-400"
                    }`}
                  >
                    <I className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </fieldset>
            <Input label="Başlık" value={v.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="ör. İstanbul İçi Kurye Hizmeti" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Öne çıkan değer" value={v.highlight} maxLength={40} onChange={(e) => set({ highlight: e.target.value })} placeholder="10:00 – 20:00" />
              <Input label="Değer açıklaması" value={v.highlight_label} maxLength={120} onChange={(e) => set({ highlight_label: e.target.value })} placeholder="arası hızlı teslimat" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="adv-details" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Detaylar (her satır bir madde)
              </label>
              <textarea
                id="adv-details"
                rows={3}
                value={v.details.join("\n")}
                onChange={(e) => set({ details: e.target.value.split("\n").slice(0, MAX_DETAILS + 1) })}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <Input label="Dipnot (isteğe bağlı)" value={v.footnote ?? ""} maxLength={400} onChange={(e) => set({ footnote: e.target.value || null })} />
            {Icon && (
              <div className="flex items-center gap-3 rounded-xl bg-[#1d1d1f] p-4 text-white">
                <Icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-[0.2em] text-zinc-400">{v.title || "Başlık"}</p>
                  <p className="truncate font-mono text-xl tracking-tighter">{v.highlight || "Değer"}</p>
                </div>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
