"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, History, Mail, MessageSquare, RefreshCw, Send } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  adminAudienceCounts,
  adminCommunicationDrivers,
  adminCreateCampaign,
  adminListCampaigns,
  adminNotificationLogs,
} from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { smsParts } from "@/lib/sms";
import type {
  AudienceCount,
  Campaign,
  CampaignAudience,
  CommunicationDrivers,
  MessageChannel,
  NotificationLogEntry,
} from "@/types";

type Tab = MessageChannel | "history";

// Mirrors the server's bounds (`app/schemas/communication.py`).
const SMS_MAX = 918;
const EMAIL_MAX = 50_000;
const MANUAL_MAX = 500;

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";
const labelClass = "text-sm font-medium text-slate-700 dark:text-zinc-300";
const hintClass = "mt-1.5 text-xs text-slate-500 dark:text-zinc-400";

const AUDIENCE_LABEL: Record<CampaignAudience, string> = {
  all: "Tüm müşteriler",
  RETAIL: "Bireysel",
  CAFE: "Kafe",
  WHOLESALE: "Toptan",
  DEALER: "Bayi",
  manual: "Elle girilen alıcılar",
};
const STATUS: Record<Campaign["status"], { text: string; className: string }> = {
  queued: { text: "Sırada", className: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10" },
  sending: { text: "Gönderiliyor", className: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30" },
  done: { text: "Tamamlandı", className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" },
  failed: { text: "Başarısız", className: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30" },
};
const PURPOSE: Record<string, string> = { campaign: "Kampanya", password_reset: "Şifre yenileme" };

/** One per line, or separated by commas / semicolons. */
const splitRecipients = (raw: string) =>
  raw
    .split(/[\n,;]+/)
    .map((r) => r.trim())
    .filter(Boolean);

function TabButton({ id, active, onClick, Icon, children }: {
  id: Tab;
  active: boolean;
  onClick: (id: Tab) => void;
  Icon: typeof Mail;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-zinc-100"
          : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden /> {children}
    </button>
  );
}

/** Who the campaign goes to, with how many of each group can receive it. */
function AudiencePicker({ channel, value, onChange }: {
  channel: MessageChannel;
  value: CampaignAudience;
  onChange: (value: CampaignAudience) => void;
}) {
  const [counts, setCounts] = useState<AudienceCount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // One picker per channel (the composer is keyed by it), so no reset needed.
    const controller = new AbortController();
    adminAudienceCounts(channel, controller.signal)
      .then(setCounts)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Alıcı sayıları yüklenemedi."));
      });
    return () => controller.abort();
  }, [channel]);

  const options: { key: CampaignAudience; label: string; count?: AudienceCount }[] = [
    ...(counts ?? []).map((c) => ({ key: c.key, label: AUDIENCE_LABEL[c.key] ?? c.label, count: c })),
    { key: "manual", label: AUDIENCE_LABEL.manual },
  ];

  return (
    <div>
      <p id={`audience-${channel}`} className={labelClass}>
        Alıcılar
      </p>
      {error && <div className="mt-2"><Alert variant="error">{error}</Alert></div>}
      {counts === null && !error ? (
        <div className="mt-2 h-20 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
      ) : (
        <div role="radiogroup" aria-labelledby={`audience-${channel}`} className="mt-2 grid gap-2 sm:grid-cols-3">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={value === o.key}
              onClick={() => onChange(o.key)}
              className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
                value === o.key
                  ? "border-red-500 bg-red-50/60 ring-4 ring-red-500/15 dark:bg-red-500/10"
                  : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400">
                {o.count
                  ? `${o.count.eligible.toLocaleString("tr-TR")} izinli / ${o.count.total.toLocaleString("tr-TR")} müşteri`
                  : channel === "sms" ? "Numaraları kendiniz girin" : "Adresleri kendiniz girin"}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className={hintClass}>
        Toplu iletiler yalnızca {channel === "sms" ? "SMS" : "e-posta"} kampanyalarına izin vermiş müşterilere gider
        (6563 sayılı Kanun). Müşteriler izni Hesabım sayfasından verir ya da kaldırır.
      </p>
    </div>
  );
}

function ManualRecipients({ channel, value, onChange, consent, onConsent }: {
  channel: MessageChannel;
  value: string;
  onChange: (v: string) => void;
  consent: boolean;
  onConsent: (v: boolean) => void;
}) {
  const count = splitRecipients(value).length;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`manual-${channel}`} className={labelClass}>
            {channel === "sms" ? "Cep telefonu numaraları" : "E-posta adresleri"}
          </label>
          <span className={`text-xs tabular-nums ${count > MANUAL_MAX ? "text-red-600" : "text-slate-500 dark:text-zinc-400"}`}>
            {count}/{MANUAL_MAX}
          </span>
        </div>
        <textarea
          id={`manual-${channel}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={channel === "sms" ? "0532 123 45 67\n0544 765 43 21" : "ornek@firma.com\nbaska@firma.com"}
          className={`${fieldClass} mt-2 resize-y py-2.5 font-mono`}
        />
        <p className={hintClass}>Her satıra bir alıcı (virgülle de ayırabilirsiniz). Geçersiz olanlar ve tekrarlar atlanır.</p>
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
        <span>Bu alıcıların ticari ileti almaya onay verdiğini onaylıyorum.</span>
      </label>
    </div>
  );
}

function SmsCounter({ text, optOut }: { text: string; optOut: string }) {
  const full = optOut ? `${text}\n${optOut}` : text;
  const p = smsParts(full);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400" aria-live="polite">
      <span className="tabular-nums">
        <strong className="font-semibold text-slate-900 dark:text-zinc-100">{p.units}</strong> karakter
      </span>
      <span className="tabular-nums">
        <strong className={`font-semibold ${p.parts > 3 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-zinc-100"}`}>{p.parts}</strong> SMS
      </span>
      <span>{p.encoding === "GSM-7" ? "GSM (160 karakter / SMS)" : "Unicode (70 karakter / SMS)"}</span>
      {p.parts > 0 && <span className="tabular-nums">Son SMS’te {p.remaining} karakter yer var</span>}
      {p.nonGsm.length > 0 && (
        <span className="w-full text-amber-700 dark:text-amber-400">
          {p.nonGsm.slice(0, 8).join(" ")} karakterleri SMS’i Unicode’a çevirir; ı→i, ş→s, ğ→g yazarak SMS sayısını azaltabilirsiniz.
        </span>
      )}
    </div>
  );
}

function Composer({ channel, drivers, onSent }: {
  channel: MessageChannel;
  drivers: CommunicationDrivers | null;
  onSent: () => void;
}) {
  const [audience, setAudience] = useState<CampaignAudience>("all");
  const [manual, setManual] = useState("");
  const [consent, setConsent] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [format, setFormat] = useState<"text" | "html">("text");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const optOut = channel === "sms" ? (drivers?.sms_opt_out_text ?? "") : "";
  const manualList = splitRecipients(manual);
  const problem =
    !body.trim()
      ? "Bir mesaj yazın."
      : channel === "email" && !subject.trim()
        ? "Bir konu yazın."
        : channel === "sms" && body.length > SMS_MAX
          ? `SMS en fazla ${SMS_MAX} karakter olabilir.`
          : audience === "manual" && manualList.length === 0
            ? "En az bir alıcı girin."
            : audience === "manual" && manualList.length > MANUAL_MAX
              ? `Elle en fazla ${MANUAL_MAX} alıcı girilebilir.`
              : audience === "manual" && !consent
                ? "Elle girilen alıcıların onayını işaretleyin."
                : null;

  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setResult(null);
      setConfirming(false);
    };
  }

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const campaign = await adminCreateCampaign({
        channel,
        audience,
        manual_recipients: audience === "manual" ? manualList : [],
        consent_confirmed: audience === "manual" && consent,
        subject: channel === "email" ? subject.trim() : null,
        body,
        body_format: channel === "email" ? format : "text",
      });
      setResult({
        kind: "success",
        text: `Kampanya sıraya alındı: ${campaign.total.toLocaleString("tr-TR")} alıcı. İlerlemeyi Geçmiş sekmesinden izleyebilirsiniz.`,
      });
      setBody("");
      setSubject("");
      setManual("");
      setConsent(false);
      onSent();
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kampanya gönderilemedi.") });
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  const previewHtml = useMemo(() => {
    if (channel !== "email") return "";
    const content =
      format === "html"
        ? body
        : body
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
            .join("");
    return `<!doctype html><meta charset="utf-8"><style>body{font:14px/1.6 system-ui,sans-serif;color:#0f172a;margin:16px}</style>${content}`;
  }, [channel, body, format]);

  return (
    <div className={`grid gap-6 ${channel === "email" ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]" : "max-w-4xl"}`}>
      <section aria-label={channel === "sms" ? "Toplu SMS" : "Toplu e-posta"} className={`${panelClass} space-y-5 p-5 sm:p-6`}>
        <AudiencePicker channel={channel} value={audience} onChange={edit(setAudience)} />
        {audience === "manual" && (
          <ManualRecipients channel={channel} value={manual} onChange={edit(setManual)} consent={consent} onConsent={edit(setConsent)} />
        )}

        {channel === "email" && (
          <div>
            <label htmlFor="email-subject" className={labelClass}>
              Konu
            </label>
            <input id="email-subject" value={subject} maxLength={200} onChange={(e) => edit(setSubject)(e.target.value)} placeholder="Örn. Yeni sezon nargile takımları geldi" className={`${fieldClass} mt-2 h-11`} />
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`body-${channel}`} className={labelClass}>
              Mesaj
            </label>
            {channel === "email" && (
              <div role="radiogroup" aria-label="Mesaj biçimi" className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
                {(["text", "html"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={format === f}
                    onClick={() => edit(setFormat)(f)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${format === f ? "bg-white shadow-sm dark:bg-white/15" : "text-slate-500 dark:text-zinc-400"}`}
                  >
                    {f === "text" ? "Düz metin" : "HTML"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            id={`body-${channel}`}
            value={body}
            maxLength={channel === "sms" ? SMS_MAX : EMAIL_MAX}
            onChange={(e) => edit(setBody)(e.target.value)}
            rows={channel === "sms" ? 5 : 12}
            placeholder={channel === "sms" ? "Örn. Hafta sonuna özel tüm lülelerde %10 indirim! nargilemalzemesi.com" : format === "html" ? "<h1>Merhaba</h1>\n<p>…</p>" : "Merhaba,\n\nYeni ürünlerimiz geldi…"}
            className={`${fieldClass} mt-2 resize-y py-3 leading-6 ${format === "html" && channel === "email" ? "font-mono text-xs" : ""}`}
          />
          {channel === "sms" ? (
            <>
              <SmsCounter text={body} optOut={optOut} />
              {optOut && <p className={hintClass}>Her SMS’in sonuna ret satırı eklenir: “{optOut}” (sayaçta dahil).</p>}
            </>
          ) : (
            <p className={hintClass}>
              Her e-postanın sonuna, alıcının izni hesabından kaldırabileceğini söyleyen bir satır eklenir.
            </p>
          )}
        </div>

        {problem && body && <Alert variant="error">{problem}</Alert>}
        {result && <Alert variant={result.kind}>{result.text}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {confirming ? (
            <>
              <p className="text-sm text-slate-600 sm:mr-auto dark:text-zinc-300">
                {audience === "manual"
                  ? `${manualList.length} alıcıya`
                  : `“${AUDIENCE_LABEL[audience]}” kitlesindeki izinli müşterilere`}{" "}
                gönderilecek. Bu işlem geri alınamaz.
              </p>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <Button type="button" onClick={send} loading={sending} className="sm:w-auto!">
                <Send className="h-4 w-4" aria-hidden /> Evet, gönder
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setConfirming(true)} disabled={!!problem} className="sm:w-auto!">
              <Send className="h-4 w-4" aria-hidden /> Gönder
            </Button>
          )}
        </div>
      </section>

      {channel === "email" && (
        <aside className={`${panelClass} self-start overflow-hidden`} aria-label="Önizleme">
          <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">Önizleme</div>
          <div className="px-5 py-3 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-slate-700 dark:text-zinc-200">Konu:</span> {subject || "—"}
          </div>
          {body.trim() ? (
            // Sandboxed: the admin's HTML is shown, never run.
            <iframe title="E-posta önizlemesi" sandbox="" srcDoc={previewHtml} className="h-96 w-full border-t border-slate-200 bg-white dark:border-white/10" />
          ) : (
            <p className="border-t border-slate-200 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-zinc-400">
              Önizleme için bir mesaj yazın.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

function HistoryView({ reloadKey }: { reloadKey: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [logs, setLogs] = useState<NotificationLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([adminListCampaigns(controller.signal), adminNotificationLogs(controller.signal)])
      .then(([c, l]) => {
        setCampaigns(c);
        setLogs(l);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Geçmiş yüklenemedi."));
      });
    return () => controller.abort();
  }, [reloadKey, tick]);

  // While a campaign is still going out, look again every few seconds.
  const running = campaigns?.some((c) => c.status === "queued" || c.status === "sending");
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setTick((n) => n + 1), 4000);
    return () => clearTimeout(t);
  }, [running, campaigns]);

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400";
  const td = "px-3 py-2.5 align-top";

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      <section aria-labelledby="campaigns-heading" className={`${panelClass} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-white/10">
          <h2 id="campaigns-heading" className="text-sm font-semibold">
            Kampanyalar
          </h2>
          <button type="button" onClick={() => setTick((n) => n + 1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Yenile
          </button>
        </div>
        {campaigns === null ? (
          <div className="h-32 motion-safe:animate-pulse" aria-busy />
        ) : campaigns.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz kampanya gönderilmedi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.03]">
                <tr>
                  <th className={th}>Tarih</th>
                  <th className={th}>Kanal</th>
                  <th className={th}>Kitle</th>
                  <th className={th}>İçerik</th>
                  <th className={th}>Durum</th>
                  <th className={`${th} text-right`}>Gönderilen / Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className={`${td} whitespace-nowrap tabular-nums text-slate-500 dark:text-zinc-400`}>{formatDate(c.created_at)}</td>
                    <td className={td}>{c.channel === "sms" ? `SMS${c.sms_segments ? ` (${c.sms_segments} parça)` : ""}` : "E-posta"}</td>
                    <td className={td}>{AUDIENCE_LABEL[c.audience] ?? c.audience}</td>
                    <td className={`${td} max-w-xs`}>
                      <span className="line-clamp-2 break-words">{c.subject ? <strong className="font-semibold">{c.subject} · </strong> : null}{c.body.replace(/<[^>]+>/g, " ")}</span>
                    </td>
                    <td className={td}>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS[c.status].className}`}>{STATUS[c.status].text}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums`}>
                      {c.sent.toLocaleString("tr-TR")} / {c.total.toLocaleString("tr-TR")}
                      {c.failed > 0 && <span className="block text-xs text-red-600 dark:text-red-400">{c.failed} başarısız</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="logs-heading" className={`${panelClass} overflow-hidden`}>
        <h2 id="logs-heading" className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">
          Son gönderilen iletiler
        </h2>
        {logs === null ? (
          <div className="h-32 motion-safe:animate-pulse" aria-busy />
        ) : logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz ileti yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.03]">
                <tr>
                  <th className={th}>Tarih</th>
                  <th className={th}>Kanal</th>
                  <th className={th}>Alıcı</th>
                  <th className={th}>Amaç</th>
                  <th className={th}>Sağlayıcı</th>
                  <th className={th}>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} whitespace-nowrap tabular-nums text-slate-500 dark:text-zinc-400`}>{formatDate(l.created_at)}</td>
                    <td className={td}>{l.channel === "sms" ? "SMS" : "E-posta"}</td>
                    <td className={`${td} font-mono text-xs`}>{l.recipient}</td>
                    <td className={td}>{PURPOSE[l.purpose] ?? l.purpose}</td>
                    <td className={td}>{l.provider === "mock" ? "Test (gönderilmedi)" : l.provider}</td>
                    <td className={td}>
                      {l.status === "sent" ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Gönderildi</span>
                      ) : l.status === "failed" ? (
                        <span className="text-red-600 dark:text-red-400" title={l.error ?? undefined}>
                          Başarısız{l.error ? `: ${l.error.slice(0, 60)}` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-500">Bekliyor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * "İletişim & Bildirimler": bulk SMS and e-mail to customers who agreed to
 * campaign messages, and the log of everything sent (password codes too).
 */
export function AdminCommunicationsView() {
  const [tab, setTab] = useState<Tab>("sms");
  const [drivers, setDrivers] = useState<CommunicationDrivers | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const sent = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    adminCommunicationDrivers(controller.signal)
      .then(setDrivers)
      .catch(() => {
        // Non-critical: the test-mode note just does not show.
      });
    return () => controller.abort();
  }, []);

  const mock = drivers ? [drivers.sms === "mock" && "SMS", drivers.email === "mock" && "e-posta"].filter(Boolean) : [];

  return (
    <>
      <AdminPageHeader
        title="İletişim & Bildirimler"
        description="Kampanya iletisine izin vermiş müşterilere toplu SMS ve e-posta gönderin; gönderilen her iletiyi (şifre yenileme kodları dahil) kayıtta görün."
      />
      {mock.length > 0 && (
        <p className="mb-6 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" role="status">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Test modu ({mock.join(" ve ")}):</strong> sağlayıcı ayarlanmadığı için bu kanaldaki iletiler gerçekte
            gönderilmez; sunucu kaydına ve aşağıdaki geçmişe “Test” olarak yazılır. Canlıya almak için sunucunun .env
            dosyasına sağlayıcı bilgilerini girin.
          </span>
        </p>
      )}
      <div role="tablist" aria-label="İletişim" className="mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        <TabButton id="sms" active={tab === "sms"} onClick={setTab} Icon={MessageSquare}>
          Toplu SMS
        </TabButton>
        <TabButton id="email" active={tab === "email"} onClick={setTab} Icon={Mail}>
          Toplu E-posta
        </TabButton>
        <TabButton id="history" active={tab === "history"} onClick={setTab} Icon={History}>
          Geçmiş
        </TabButton>
      </div>
      {tab === "history" ? (
        <HistoryView reloadKey={reloadKey} />
      ) : (
        <Composer key={tab} channel={tab} drivers={drivers} onSent={sent} />
      )}
    </>
  );
}
