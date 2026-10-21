"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SheetField, sheetInputClass } from "@/components/admin/products/SheetParts";
import {
  LOCALE_LABEL,
  TRANSLATED_LOCALES,
  translationStarted,
  type TranslationDraft,
} from "@/components/admin/products/sheetDraft";
import type { TranslatedLocale } from "@/types";

const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 160;

function Count({ value, max }: { value: string; max: number }) {
  const near = value.length >= max * 0.8;
  return (
    <p className={`mt-1 text-right font-mono text-[11px] tabular-nums ${near ? "text-amber-700 dark:text-amber-400" : "text-slate-400 dark:text-zinc-500"}`}>
      {value.length} / {max}
    </p>
  );
}

/**
 * "Çeviriler": the product in English and Arabic, one tab each — what the
 * /en and /ar pages show and what search engines index there. A language
 * with no name is not saved, and its page shows the Turkish (kept out of the
 * index). Brand names and model codes stay as they are. Arabic is typed
 * right to left.
 *
 * A language Claude wrote (backend app/services/auto_translate) is a draft:
 * the storefront shows it, search engines are told to skip it, until it is
 * read here and approved ("Onayla", then the sheet's Kaydet).
 */
export function TranslationFields({
  value,
  onChange,
}: {
  value: Record<TranslatedLocale, TranslationDraft>;
  onChange: (locale: TranslatedLocale, next: TranslationDraft) => void;
}) {
  const [tab, setTab] = useState<TranslatedLocale>("en");
  const t = value[tab];
  const set = <K extends keyof TranslationDraft>(key: K, v: TranslationDraft[K]) => onChange(tab, { ...t, [key]: v });
  const dir = tab === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Çeviri dili" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">
        {TRANSLATED_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={tab === l}
            onClick={() => setTab(l)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === l ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
            }`}
          >
            {LOCALE_LABEL[l]}
            {value[l].draft ? (
              <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-label="taslak, onay bekliyor" />
            ) : value[l].name.trim() ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="çevrildi" />
            ) : translationStarted(value[l]) ? (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="eksik" />
            ) : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-4" key={tab}>
        {t.draft && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              Claude çevirisi — taslak. Sayfada görünür ama arama motorlarına kapalıdır; okuyup gerekirse düzeltin, sonra onaylayın.
            </p>
            <button
              type="button"
              onClick={() => onChange(tab, { ...t, draft: false, source: null })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-500"
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> Onayla
            </button>
          </div>
        )}
        <SheetField id={`sheet-${tab}-name`} label="Ürün Adı" hint="Boş bırakılırsa bu dilde çeviri kaydedilmez; sayfa Türkçe görünür ve dizine eklenmez.">
          <input
            id={`sheet-${tab}-name`}
            value={t.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={255}
            dir={dir}
            lang={tab}
            className={sheetInputClass}
          />
        </SheetField>
        <SheetField id={`sheet-${tab}-description`} label="Ürün Açıklaması" hint="Boşsa Türkçe açıklama gösterilir.">
          <div dir={dir} lang={tab}>
            <RichTextEditor
              id={`sheet-${tab}-description`}
              labelledBy={`sheet-${tab}-description-label`}
              value={t.description}
              onChange={(html) => set("description", html)}
              minHeight="7rem"
            />
          </div>
        </SheetField>
        <div className="grid gap-4 lg:grid-cols-2">
          <SheetField id={`sheet-${tab}-meta-title`} label="SEO Başlığı">
            <input
              id={`sheet-${tab}-meta-title`}
              value={t.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              maxLength={META_TITLE_MAX}
              dir={dir}
              lang={tab}
              placeholder={t.name}
              className={sheetInputClass}
            />
            <Count value={t.metaTitle} max={META_TITLE_MAX} />
          </SheetField>
          <SheetField id={`sheet-${tab}-meta-description`} label="SEO Açıklaması">
            <input
              id={`sheet-${tab}-meta-description`}
              value={t.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              maxLength={META_DESCRIPTION_MAX}
              dir={dir}
              lang={tab}
              className={sheetInputClass}
            />
            <Count value={t.metaDescription} max={META_DESCRIPTION_MAX} />
          </SheetField>
        </div>
      </div>
    </div>
  );
}
