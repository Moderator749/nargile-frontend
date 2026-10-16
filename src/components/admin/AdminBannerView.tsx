"use client";

import { useCallback, useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import { Check, Eye, Info, Save, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { BannerPresetsManager, livePreset } from "@/components/admin/BannerPresetsManager";
import { BannerMoodIcon } from "@/components/banner/BannerMoodIcon";
import { LiveAnnouncementBar } from "@/components/banner/LiveAnnouncementBar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useNow } from "@/hooks/useNow";
import { adminGetAnnouncement, adminUpdateAnnouncement } from "@/lib/adminApi";
import {
  BANNER_ICONS,
  BANNER_PRESETS,
  DEFAULT_BANNER_ICON,
  DEFAULT_BANNER_STYLE,
  DEFAULT_CUSTOM_COLOUR,
  fromLocalInputValue,
  isHexColour,
  isPreset,
  isSafeImageUrl,
  normaliseImageUrl,
  resolveBannerIcon,
  toLocalInputValue,
} from "@/lib/banner";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { Announcement, BannerIcon, BannerPreset } from "@/types";

const MAX = 200;

const HOUR = 3_600_000;
const EXPIRY_SHORTCUTS: { label: string; at: () => Date }[] = [
  {
    label: "Bu gece 23:59",
    at: () => {
      const d = new Date();
      d.setHours(23, 59, 0, 0);
      return d;
    },
  },
  { label: "24 saat sonra", at: () => new Date(Date.now() + 24 * HOUR) },
  { label: "7 gün sonra", at: () => new Date(Date.now() + 7 * 24 * HOUR) },
];

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:[color-scheme:dark]";
const chipClass =
  "rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300";
const hintClass = "mt-2 text-xs text-slate-500 dark:text-zinc-400";

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    // Border lives on the wrapper so the legend lays out as a normal block; min-w-0 overrides
    // the fieldset default (min-inline-size: min-content) that let wide children overflow.
    <div className="border-t border-slate-200 pt-5 dark:border-white/10">
      <fieldset className="min-w-0 space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
          {legend}
        </legend>
        {children}
      </fieldset>
    </div>
  );
}

function ToggleRow(props: {
  id: string;
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <div>
        <p id={`${props.id}-label`} className="text-sm font-medium">
          {props.title}
        </p>
        <p id={`${props.id}-hint`} className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          {props.hint}
        </p>
      </div>
      <Switch
        checked={props.checked}
        disabled={props.disabled}
        onChange={props.onChange}
        labelledBy={`${props.id}-label`}
        describedBy={`${props.id}-hint`}
      />
    </div>
  );
}

export function AdminBannerView() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [expiresLocal, setExpiresLocal] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState<string>(DEFAULT_BANNER_STYLE);
  const [customColour, setCustomColour] = useState(DEFAULT_CUSTOM_COLOUR);
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [iconType, setIconType] = useState<BannerIcon>(DEFAULT_BANNER_ICON);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const now = useNow();
  const [presets, setPresets] = useState<BannerPreset[]>([]);
  const onPresetsChange = useCallback((list: BannerPreset[]) => setPresets(list), []);
  const scheduledNow = livePreset(presets, now);

  function applySaved(a: Announcement) {
    setMessage(a.message);
    setActive(a.is_active);
    setExpiresLocal(toLocalInputValue(a.expires_at));
    setShowCountdown(a.show_countdown);
    setBackgroundStyle(a.background_style);
    if (isHexColour(a.background_style)) setCustomColour(a.background_style);
    setBgImageUrl(a.bg_image_url ?? "");
    setIconType(resolveBannerIcon(a.icon_type));
    setUpdatedAt(a.updated_at);
  }

  useEffect(() => {
    const controller = new AbortController();
    adminGetAnnouncement(controller.signal)
      .then((a) => {
        applySaved(a);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(getApiErrorMessage(err, "Duyuru ayarları yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  /** Wraps a setter so any edit clears the last save result. */
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setResult(null);
    };
  }

  const trimmed = message.trim();
  // Spaces/quotes/parentheses are encoded rather than rejected, so any HTTPS image host works.
  const imageUrl = normaliseImageUrl(bgImageUrl);
  const expiresAt = fromLocalInputValue(expiresLocal);
  const expired = expiresAt !== null && now !== null && Date.parse(expiresAt) <= now;
  const imageInvalid = imageUrl !== "" && !isSafeImageUrl(imageUrl);
  const customSelected = !isPreset(backgroundStyle);

  const problem =
    active && !trimmed
      ? "Yayınlamak için bir duyuru metni girin."
      : showCountdown && !expiresAt
        ? "Geri sayım için bir bitiş tarihi ve saati seçin."
        : imageInvalid
          ? "Görsel adresi https:// ile başlayan geçerli bir URL olmalı (en fazla 500 karakter)."
          : null;

  const draft = {
    message: trimmed,
    expires_at: expiresAt,
    show_countdown: showCountdown && expiresAt !== null,
    background_style: backgroundStyle,
    bg_image_url: imageUrl && !imageInvalid ? imageUrl : null,
    icon_type: iconType,
  };

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || problem) return;
    setSaving(true);
    setResult(null);
    try {
      const saved = await adminUpdateAnnouncement({
        ...draft,
        is_active: active,
      });
      applySaved(saved);
      const savedExpired = saved.expires_at !== null && Date.parse(saved.expires_at) <= Date.now();
      setResult({
        kind: "success",
        text: !saved.is_active
          ? "Kaydedildi. Duyuru yayında değil; taslak olarak saklandı."
          : savedExpired
            ? "Kaydedildi, ancak bitiş zamanı geçmiş: duyuru sitede görünmez."
            : "Kaydedildi. Duyuru ana sayfada hemen yayında.",
      });
    } catch (err) {
      setResult({
        kind: "error",
        text: getApiErrorMessage(err, "Duyuru kaydedilemedi."),
      });
    } finally {
      setSaving(false);
    }
  }

  const status = !active
    ? {
        text: "Kapalı",
        className: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10",
      }
    : expired
      ? {
          text: "Süresi doldu",
          className:
            "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
        }
      : {
          text: expiresAt ? "Yayında olacak" : "Süresiz yayında",
          className:
            "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
        };

  return (
    <>
      <AdminPageHeader
        title="Duyurular"
        description="Sitenin en üstündeki bandı (varsayılan ve planlı metinler) ve ziyaretçilere açılışta gösterilen duyuru kartını yönetin."
      />

      {loadError ? (
        <Alert variant="error">{loadError}</Alert>
      ) : !loaded ? (
        <div className={`${panelClass} h-80 motion-safe:animate-pulse`} aria-busy />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ol
              aria-label="Bantta yayın sırası"
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 sm:grid-cols-3 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {[
                ["Planlı hazır metin", "Tarih aralığı sürüyorsa önce o görünür."],
                ["Varsayılan bant (süresiz)", "Planlı metin yokken ya da süresi bitince kendiliğinden bu görünür."],
                ["Karşılama metni", "Varsayılan bant da kapalıysa “Hoş geldiniz” yazısı görünür."],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-zinc-100">{title}</span>
                    {text}
                  </span>
                </li>
              ))}
            </ol>
            {scheduledNow && (
              <p
                className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
                role="status"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Şu an bantta planlı hazır metin yayında: “{scheduledNow.message}”
                  {scheduledNow.ends_at ? ` (${formatDate(scheduledNow.ends_at)} tarihine kadar)` : ""}. Varsayılan bant,
                  bu süre bitince kendiliğinden geri gelir.
                </span>
              </p>
            )}
            <section aria-labelledby="banner-preview" className={`${panelClass} overflow-hidden`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-white/10">
                <h2 id="banner-preview" className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden /> Varsayılan Bant (Süresiz) ·
                  Canlı önizleme
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                >
                  {status.text}
                </span>
              </div>
              {trimmed ? (
                <div
                  className={`transition-[filter,opacity] duration-300 ${active && !expired ? "" : "opacity-50 grayscale"}`}
                >
                  <LiveAnnouncementBar announcement={draft} hideOnExpire={false} />
                </div>
              ) : (
                <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-zinc-400">
                  Önizleme için bir duyuru metni yazın.
                </p>
              )}
            </section>

            <section aria-labelledby="banner-settings" className={`${panelClass} space-y-5 p-5 sm:p-6`}>
              <h2 id="banner-settings" className="sr-only">
                Duyuru ayarları
              </h2>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="banner-message" className="text-sm font-medium">
                    Duyuru metni
                  </label>
                  <span
                    className={`text-xs tabular-nums ${message.length > MAX - 20 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-zinc-500"}`}
                  >
                    {message.length}/{MAX}
                  </span>
                </div>
                <textarea
                  id="banner-message"
                  value={message}
                  maxLength={MAX}
                  rows={3}
                  onChange={(e) => edit(setMessage)(e.target.value)}
                  placeholder="Örn. 29 Ekim Cumhuriyet Bayramımız Kutlu Olsun!"
                  aria-describedby="banner-hint"
                  className={`${fieldClass} mt-2 resize-y py-3`}
                />
                <p id="banner-hint" className={`${hintClass} flex gap-1.5`}>
                  <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  Bant yalnızca bir duyurudur: metinde yazan bir indirim sepete otomatik uygulanmaz.
                </p>
              </div>

              <Fieldset legend="Görünüm">
                <div
                  role="radiogroup"
                  aria-label="Arka plan stili"
                  className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {[
                    ...BANNER_PRESETS.map((p) => ({
                      id: p.id,
                      label: p.label,
                      swatch: p.swatchClass,
                      colour: undefined,
                    })),
                    {
                      id: customColour,
                      label: "Özel renk",
                      swatch: "",
                      colour: customColour,
                    },
                  ].map((option) => {
                    const selected = option.colour ? customSelected : backgroundStyle === option.id;
                    return (
                      <div
                        key={option.label}
                        className={`flex min-w-0 flex-col rounded-xl border transition-[border-color,box-shadow] duration-200 ${
                          selected
                            ? "border-red-500 ring-4 ring-red-500/15"
                            : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                        }`}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => edit(setBackgroundStyle)(option.id)}
                          className="block w-full rounded-xl p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        >
                          <span
                            aria-hidden
                            className={`relative block h-10 rounded-lg ${option.swatch}`}
                            style={option.colour ? { backgroundColor: option.colour } : undefined}
                          >
                            {selected && (
                              <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-white p-0.5 text-red-600 shadow-sm" />
                            )}
                          </span>
                          <span className="mt-2 block truncate text-xs font-medium">{option.label}</span>
                        </button>

                        {option.colour && customSelected && (
                          <div className="flex items-center gap-2 border-t border-slate-200 px-2 py-2 dark:border-white/10">
                            <label htmlFor="banner-colour" className="sr-only">
                              Özel renk seçin
                            </label>
                            <input
                              id="banner-colour"
                              type="color"
                              value={customColour}
                              onChange={(e) => {
                                setCustomColour(e.target.value);
                                edit(setBackgroundStyle)(e.target.value);
                              }}
                              className="h-8 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-white/15 dark:bg-zinc-950"
                            />
                            <code className="truncate text-xs uppercase tabular-nums text-slate-500 dark:text-zinc-400">
                              {customColour}
                            </code>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p id="banner-icon-label" className="text-sm font-medium">
                    Simge
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby="banner-icon-label"
                    className="mt-2 grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    {BANNER_ICONS.map((option) => {
                      const selected = iconType === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => edit(setIconType)(option.id)}
                          className={`flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-left text-xs font-medium transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
                            selected
                              ? "border-red-500 ring-4 ring-red-500/15"
                              : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="flex h-5 w-6 shrink-0 items-center justify-center text-red-600 dark:text-red-400"
                          >
                            {option.id === "none" ? (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            ) : (
                              <BannerMoodIcon icon={option.id} />
                            )}
                          </span>
                          <span className="truncate">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="banner-image" className="text-sm font-medium">
                    Arka plan görseli{" "}
                    <span className="font-normal text-slate-500 dark:text-zinc-400">(isteğe bağlı)</span>
                  </label>
                  <input
                    id="banner-image"
                    type="url"
                    inputMode="url"
                    value={bgImageUrl}
                    onChange={(e) => edit(setBgImageUrl)(e.target.value)}
                    placeholder="https://…/desen.jpg"
                    aria-invalid={imageInvalid}
                    aria-describedby="banner-image-hint"
                    className={`${fieldClass} mt-2 h-11`}
                  />
                  <p id="banner-image-hint" className={hintClass}>
                    Desen veya fotoğraf; metin okunaklı kalsın diye üzerine koyu bir katman eklenir.
                  </p>
                </div>
              </Fieldset>

              <Fieldset legend="Süre">
                <div>
                  <label htmlFor="banner-expires" className="text-sm font-medium">
                    Bitiş Tarihi &amp; Saati (isteğe bağlı)
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="banner-expires"
                      type="datetime-local"
                      value={expiresLocal}
                      onChange={(e) => edit(setExpiresLocal)(e.target.value)}
                      aria-describedby="banner-expires-hint"
                      className={`${fieldClass} h-11 tabular-nums`}
                    />
                    {expiresLocal && (
                      <button
                        type="button"
                        onClick={() => {
                          edit(setExpiresLocal)("");
                          setShowCountdown(false);
                        }}
                        aria-label="Bitiş tarihini temizle"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXPIRY_SHORTCUTS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => edit(setExpiresLocal)(toLocalInputValue(s.at().toISOString()))}
                        className={chipClass}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p id="banner-expires-hint" className={hintClass}>
                    {expired
                      ? "Bu zaman geçmişte: kaydederseniz duyuru sitede görünmez."
                      : `Varsayılan bant için boş bırakın: süresiz yayında kalır. Bir tarih seçerseniz o zamanda kalkar (geri sayım için gerekir). Saat dilimi: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`}
                  </p>
                </div>

                <ToggleRow
                  id="banner-countdown"
                  title="Geri Sayım Sayacını Göster"
                  hint={
                    expiresAt
                      ? "Metnin yanında Gün / Saat / Dakika / Saniye sayacı görünür."
                      : "Önce bir bitiş tarihi seçin."
                  }
                  checked={showCountdown && expiresAt !== null}
                  disabled={!expiresAt}
                  onChange={edit(setShowCountdown)}
                />
              </Fieldset>

              <Fieldset legend="Yayın">
                <ToggleRow
                  id="banner-active"
                  title="Varsayılan bandı yayınla"
                  hint="Planlı bir hazır metin yokken bantta bu görünür. Kapalıyken ayarlar taslak olarak saklanır."
                  checked={active}
                  onChange={edit(setActive)}
                />
              </Fieldset>

              {problem && <Alert variant="error">{problem}</Alert>}
              {result && <Alert variant={result.kind}>{result.text}</Alert>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  {updatedAt ? `Son güncelleme: ${formatDate(updatedAt)}` : "Henüz kaydedilmedi."}
                </p>
                <Button type="submit" loading={saving} disabled={!!problem} className="sm:w-auto!">
                  <Save className="h-4 w-4" aria-hidden /> Kaydet
                </Button>
              </div>
            </section>
          </form>

          <div className="mt-6">
            <BannerPresetsManager
              onApply={(text, icon) => {
                edit(setMessage)(text);
                setIconType(icon);
                document.getElementById("banner-message")?.focus();
              }}
              onPresetsChange={onPresetsChange}
            />
          </div>
        </>
      )}
    </>
  );
}
