"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { adminGetHomeTranslations, adminSaveHomeTranslations } from "@/lib/adminApi";
import { API_URL } from "@/lib/config";
import { getApiErrorMessage } from "@/lib/errors";
import { collectTexts, type TextMemory } from "@/lib/homeTranslations";
import { refreshStorefront } from "@/lib/revalidate";
import type { Homepage } from "@/types";

type Lang = "en" | "ar";
const LANGS: { key: Lang; label: string }[] = [
  { key: "en", label: "İngilizce (EN)" },
  { key: "ar", label: "Arapça (AR)" },
];

const fieldClass =
  "block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";

/** What the storefront shows outside the homepage document: slides, boxes, the live banner and popup. */
async function liveTexts(signal: AbortSignal): Promise<unknown[]> {
  const get = (path: string) =>
    fetch(`${API_URL}${path}`, { cache: "no-store", signal })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  return Promise.all([get("/home/content"), get("/banners/active"), get("/announcements/popup")]);
}

/**
 * "Çeviriler": the homepage's texts in English and Arabic (/en, /ar).
 *
 * Every text the storefront shows from this editor — section titles, slides,
 * boxes, menu labels, the footer, the live banner and popup, and the
 * defaults where nothing was saved — is listed once, with its English and
 * Arabic. A text left blank shows in Turkish. Translations are matched to
 * the Turkish exactly, so a text rewritten in Turkish shows here as missing
 * again (lib/homeTranslations).
 */
export function TranslationsTab({ doc }: { doc: Homepage }) {
  const [memory, setMemory] = useState<Record<Lang, TextMemory> | null>(null);
  const [saved, setSaved] = useState<Record<Lang, TextMemory> | null>(null);
  const [extra, setExtra] = useState<unknown[]>([]);
  const [filter, setFilter] = useState<"missing" | "all">("missing");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminGetHomeTranslations(controller.signal)
      .then((t) => {
        const both = { en: t.en ?? {}, ar: t.ar ?? {} };
        setMemory(both);
        setSaved(both);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setResult({ kind: "error", text: getApiErrorMessage(err, "Çeviriler yüklenemedi.") });
      });
    void liveTexts(controller.signal).then(setExtra);
    return () => controller.abort();
  }, []);

  const texts = useMemo(() => [...collectTexts([doc, ...extra])], [doc, extra]);
  const missing = (text: string) => !memory?.en[text] || !memory?.ar[text];
  const shown = texts.filter(
    (text) =>
      (filter === "all" || missing(text)) &&
      (!query.trim() || text.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr"))),
  );
  const done = memory ? texts.filter((t) => memory.en[t] && memory.ar[t]).length : 0;
  const dirty = JSON.stringify(memory) !== JSON.stringify(saved);

  async function save() {
    if (!memory) return;
    setSaving(true);
    setResult(null);
    try {
      const out = await adminSaveHomeTranslations(memory);
      const both = { en: out.en ?? {}, ar: out.ar ?? {} };
      setMemory(both);
      setSaved(both);
      void refreshStorefront();
      setResult({ kind: "success", text: "Çeviriler kaydedildi; /en ve /ar sayfaları güncellendi." });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  if (!memory) return result ? <Alert variant={result.kind}>{result.text}</Alert> : <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        Ana sayfadaki metinlerin İngilizce ve Arapça karşılıkları. Boş bırakılan metin o dilde Türkçe görünür. Türkçe metni
        değiştirdiğinizde çevirisi “eksik” olarak yeniden listelenir. <strong>{done}</strong> / {texts.length} metin iki dilde de çevrildi.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {(["missing", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-300"}`}
          >
            {f === "missing" ? `Eksikler (${texts.filter(missing).length})` : `Tümü (${texts.length})`}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Metinlerde ara"
          aria-label="Metinlerde ara"
          className={`${fieldClass} ms-auto h-9 max-w-xs py-1`}
        />
      </div>

      {result && <Alert variant={result.kind}>{result.text}</Alert>}

      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
        {shown.map((text) => {
          const rows = Math.min(8, Math.max(1, Math.ceil(text.length / 70)));
          return (
            <li key={text} className="grid gap-3 p-4 lg:grid-cols-3">
              <p className="whitespace-pre-line text-sm text-slate-800 dark:text-zinc-200">{text}</p>
              {LANGS.map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="sr-only">{label}</span>
                  <textarea
                    rows={rows}
                    dir={key === "ar" ? "rtl" : "ltr"}
                    lang={key}
                    placeholder={label}
                    value={memory[key][text] ?? ""}
                    onChange={(e) => setMemory((m) => (m ? { ...m, [key]: { ...m[key], [text]: e.target.value } } : m))}
                    className={fieldClass}
                  />
                </label>
              ))}
            </li>
          );
        })}
        {shown.length === 0 && <li className="p-6 text-center text-sm text-slate-500">Gösterilecek metin yok.</li>}
      </ul>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Çevirileri Kaydet
        </button>
      </div>
    </div>
  );
}
