"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { KeyRound, Plus, UserMinus, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { SystemAdminBadge } from "@/components/admin/SystemAdminBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  adminCreateTeamMember,
  adminListTeam,
  adminRemoveTeamMember,
  adminSetTeamPassword,
  adminUpdateTeamMember,
} from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/useAuthStore";
import type { TeamMember, TeamMemberUpdate, TeamRole } from "@/types";

// The server's bound (app.core.security.ADMIN_PASSWORD_MIN).
const PASSWORD_MIN = 8;

const ROLES: { id: TeamRole; label: string; hint: string }[] = [
  { id: "SUPER_ADMIN", label: "Süper Yönetici", hint: "Tüm panel; Günün Notu ve Ekip Kanalı'nda her mesajı silebilir." },
  { id: "ADMIN", label: "Yönetici", hint: "Tüm panel." },
  { id: "STAFF", label: "Personel", hint: "Yalnızca Ekip Kanalı." },
];
const roleLabel = (role: TeamRole) => ROLES.find((r) => r.id === role)?.label ?? role;

const ghostClass =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5";
const compactSelect =
  "h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100";

const nameOf = (m: TeamMember) => m.full_name || m.username || m.email;

/** "Yeni üye": an account made straight into the team. */
function NewMemberForm({ onCreated, onCancel }: { onCreated: (m: TeamMember) => void; onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TeamRole>("ADMIN");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = !email.includes("@")
    ? "Bir e-posta adresi girin."
    : password.length < PASSWORD_MIN
      ? `Şifre en az ${PASSWORD_MIN} karakter olmalı.`
      : null;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (problem || saving) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(
        await adminCreateTeamMember({
          email: email.trim(),
          username: username.trim() || null,
          full_name: fullName.trim() || null,
          role,
          password,
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Ekip üyesi eklenemedi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${panelClass} mb-6 space-y-4 p-5 sm:p-6`} aria-labelledby="new-member-heading">
      <h2 id="new-member-heading" className="text-sm font-semibold">
        Yeni ekip üyesi
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="E-posta" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Kullanıcı adı (isteğe bağlı)"
          autoComplete="off"
          value={username}
          maxLength={30}
          onChange={(e) => setUsername(e.target.value)}
          hint="Girişte e-posta yerine de kullanılabilir."
        />
        <Input label="Ad soyad (isteğe bağlı)" value={fullName} maxLength={150} onChange={(e) => setFullName(e.target.value)} />
        <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value as TeamRole)} hint={ROLES.find((r) => r.id === role)?.hint}>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
        <Input
          label="Başlangıç şifresi"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`En az ${PASSWORD_MIN} karakter. Üye ilk girişten sonra Hesabım'dan değiştirebilir.`}
        />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={ghostClass}>
          Vazgeç
        </button>
        <Button type="submit" loading={saving} disabled={!!problem} className="h-9! w-auto! text-xs!">
          Ekle
        </Button>
      </div>
    </form>
  );
}

/** One member's row: who, and — for anyone but oneself — role, state, password and removal. */
function MemberRow({
  member,
  onChanged,
  onRemoved,
  onNotice,
}: {
  member: TeamMember;
  onChanged: (m: TeamMember) => void;
  onRemoved: (id: string) => void;
  onNotice: (n: { kind: "success" | "error"; text: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  async function update(change: TeamMemberUpdate) {
    setBusy(true);
    try {
      onChanged(await adminUpdateTeamMember(member.id, change));
      if (change.is_active === false) onNotice({ kind: "success", text: `${nameOf(member)} pasifleştirildi; oturumları kapatıldı.` });
    } catch (err) {
      onNotice({ kind: "error", text: getApiErrorMessage(err, "Değişiklik kaydedilemedi.") });
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (password === null || password.length < PASSWORD_MIN) return;
    setBusy(true);
    try {
      await adminSetTeamPassword(member.id, password);
      setPassword(null);
      onNotice({ kind: "success", text: `${nameOf(member)} için yeni şifre kaydedildi; açık oturumları kapatıldı.` });
    } catch (err) {
      onNotice({ kind: "error", text: getApiErrorMessage(err, "Şifre kaydedilemedi.") });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`${nameOf(member)} panelden çıkarılsın mı?\n\nHesap pasif bir müşteri hesabına döner ve tüm oturumları kapanır. Siparişleri ve notları silinmez.`)) return;
    setBusy(true);
    try {
      await adminRemoveTeamMember(member.id);
      onRemoved(member.id);
      onNotice({ kind: "success", text: `${nameOf(member)} panelden çıkarıldı.` });
    } catch (err) {
      onNotice({ kind: "error", text: getApiErrorMessage(err, "Üye panelden çıkarılamadı.") });
      setBusy(false);
    }
  }

  const switchId = `member-${member.id}-active`;
  return (
    <li className={`p-4 transition-opacity duration-200 ${member.is_active ? "" : "opacity-70"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              member.is_superadmin
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300"
            }`}
          >
            {nameOf(member).slice(0, 1).toLocaleUpperCase("tr-TR")}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <span className="truncate">{nameOf(member)}</span>
              {member.is_superadmin && <SystemAdminBadge />}
              {member.is_me && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                  Siz
                </span>
              )}
              {!member.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-zinc-400">
                  Pasif
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-400">
              {member.email}
              {member.username ? ` · @${member.username}` : ""}
            </p>
          </div>
        </div>

        {member.is_me ? (
          <p className="text-xs text-slate-500 lg:max-w-56 lg:text-right dark:text-zinc-400">
            {roleLabel(member.role)} · Kendi rolünüz ve durumunuz buradan değiştirilemez.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <label className="sr-only" htmlFor={`member-${member.id}-role`}>
              {nameOf(member)} rolü
            </label>
            <select
              id={`member-${member.id}-role`}
              value={member.role}
              disabled={busy}
              onChange={(e) => void update({ role: e.target.value as TeamRole })}
              className={compactSelect}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="inline-flex h-9 items-center gap-2 rounded-lg px-2 ring-1 ring-slate-200 dark:ring-white/10">
              <span id={`${switchId}-label`} className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                Aktif
              </span>
              <Switch
                checked={member.is_active}
                disabled={busy}
                onChange={(active) => void update({ is_active: active })}
                labelledBy={`${switchId}-label`}
              />
            </span>
            <button type="button" onClick={() => setPassword(password === null ? "" : null)} disabled={busy} className={ghostClass}>
              <KeyRound className="h-3.5 w-3.5" aria-hidden /> Şifre belirle
            </button>
            <button type="button" onClick={() => void remove()} disabled={busy} className={`${ghostClass} text-red-700! dark:text-red-300!`}>
              <UserMinus className="h-3.5 w-3.5" aria-hidden /> Panelden çıkar
            </button>
          </div>
        )}
      </div>

      {password !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void savePassword();
          }}
          className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-end dark:border-white/10"
        >
          <div className="flex-1">
            <Input
              label={`${nameOf(member)} için yeni şifre`}
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={`En az ${PASSWORD_MIN} karakter. Kaydedince üyenin açık oturumları kapanır.`}
            />
          </div>
          <div className="flex gap-2 sm:mb-6">
            <button type="button" onClick={() => setPassword(null)} className={ghostClass} aria-label="Vazgeç">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <Button type="submit" loading={busy} disabled={password.length < PASSWORD_MIN} className="h-9! w-auto! text-xs!">
              Kaydet
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}

/**
 * "Yöneticiler": the panel team, for the Sistem Yöneticisi alone (the server
 * refuses anyone else; the menu does not offer it to them).
 */
export function AdminUsersView() {
  const me = useAuthStore((s) => s.user);
  const allowed = !!me?.is_superadmin;
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    adminListTeam(controller.signal)
      .then(setMembers)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Ekip yüklenemedi."));
      });
    return () => controller.abort();
  }, [allowed]);

  const replace = (m: TeamMember) => setMembers((list) => list?.map((x) => (x.id === m.id ? m : x)) ?? list);

  // To anyone else this is an address with nothing at it, as the API says (404).
  if (!allowed) {
    return (
      <div className={`${panelClass} px-6 py-16 text-center`}>
        <p className="text-sm font-semibold">Sayfa bulunamadı</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Aradığınız sayfa yok ya da taşınmış olabilir.</p>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Yöneticiler"
        description="Panel ekibi: yeni yönetici ya da personel ekleyin, rolünü ve durumunu değiştirin, şifresini yenileyin veya panelden çıkarın."
        actions={
          !adding ? (
            <button type="button" onClick={() => setAdding(true)} className={`${ghostClass} shrink-0 whitespace-nowrap`}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Yeni üye
            </button>
          ) : null
        }
      />

      {adding && (
        <NewMemberForm
          onCancel={() => setAdding(false)}
          onCreated={(m) => {
            setMembers((list) => [...(list ?? []), m]);
            setAdding(false);
            setNotice({ kind: "success", text: `${nameOf(m)} ekibe eklendi (${roleLabel(m.role)}).` });
          }}
        />
      )}
      {notice && (
        <div className="mb-4">
          <Alert variant={notice.kind}>{notice.text}</Alert>
        </div>
      )}
      {loadError ? (
        <Alert variant="error">{loadError}</Alert>
      ) : !members ? (
        <div className={`${panelClass} h-64 motion-safe:animate-pulse`} aria-busy />
      ) : (
        <section aria-label="Ekip üyeleri" className={panelClass}>
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                onChanged={replace}
                onRemoved={(id) => setMembers((list) => list?.filter((x) => x.id !== id) ?? list)}
                onNotice={setNotice}
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
