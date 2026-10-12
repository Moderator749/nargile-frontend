"use client";

import Link from "next/link";
import { ArrowUpRight, GalleryHorizontal, LayoutGrid } from "lucide-react";

import { adminSelectClass } from "@/components/admin/ContentEditor";
import {
  IconSelect,
  ImageField,
  ListEditor,
  NavTargetFields,
  Panel,
  StringList,
  TextArea,
  TextField,
} from "@/components/admin/homepage/fields";
import { Switch } from "@/components/ui/Switch";
import { categoryTree } from "@/lib/categories";
import { SECTION_LABELS } from "@/lib/homepage";
import { autoSidebar } from "@/lib/storefrontNav";
import type {
  Brand,
  Category,
  Homepage,
  HomeAdvantageCard,
  HomeFooterColumn,
  HomeNavItem,
  HomeSections,
  HomeShowcaseTile,
  HomeSocialKind,
} from "@/types";

type Set<K extends keyof Homepage> = (value: Homepage[K]) => void;

// ── Bölümler: the master switches ────────────────────────────────────────────

export function SectionsTab({
  sections,
  busy,
  onToggle,
}: {
  sections: HomeSections;
  busy: keyof HomeSections | null;
  onToggle: (key: keyof HomeSections, on: boolean) => void;
}) {
  return (
    <Panel title="Bölümler" hint="Her anahtar anında kaydedilir ve mağazada hemen uygulanır.">
      <ul className="divide-y divide-slate-200 dark:divide-white/10">
        {(Object.keys(SECTION_LABELS) as (keyof HomeSections)[]).map((key) => (
          <li key={key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div>
              <p id={`section-${key}`} className="text-sm font-semibold">
                {SECTION_LABELS[key].title}
                {!sections[key] && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-zinc-400">
                    Gizli
                  </span>
                )}
              </p>
              <p id={`section-${key}-hint`} className="text-xs text-slate-500 dark:text-zinc-400">
                {SECTION_LABELS[key].hint}
              </p>
            </div>
            <Switch
              checked={sections[key]}
              onChange={(on) => onToggle(key, on)}
              labelledBy={`section-${key}`}
              describedBy={`section-${key}-hint`}
              disabled={busy !== null}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── Menüler ──────────────────────────────────────────────────────────────────

const blankNav = (): HomeNavItem => ({ label: "YENİ BAĞLANTI", href: "/catalog" });

/** Categories in menu order, groups first with their subcategories under them. */
function categoryOptions(categories: Category[]) {
  return categoryTree(categories).flatMap((group) => [group, ...group.children]);
}

function NavList({
  items,
  onChange,
  max,
  accent,
  categories,
  brands,
}: {
  items: HomeNavItem[];
  onChange: (items: HomeNavItem[]) => void;
  max: number;
  accent: boolean;
  categories: Category[];
  brands: Brand[];
}) {
  const nameOf = (item: HomeNavItem) =>
    (item.slug && categories.find((c) => c.slug === item.slug)?.name) ||
    (item.brand && brands.find((b) => b.slug === item.brand)?.name) ||
    "";
  return (
    <div className="space-y-3">
      <ListEditor
        items={items}
        onChange={onChange}
        blank={blankNav}
        max={max}
        addLabel="Özel bağlantı ekle"
        itemLabel={(item) => item.label || nameOf(item) || "(adsız)"}
        render={(item, update) => (
          <div className="space-y-3">
            <TextField
              label="Görünen ad"
              value={item.label}
              max={60}
              onChange={(label) => update({ label })}
              placeholder={nameOf(item) || undefined}
              hint={item.slug || item.brand ? "Boş bırakılırsa kategorinin / markanın güncel adı kullanılır." : undefined}
            />
            <NavTargetFields item={item} update={update} categories={categories} brands={brands} />
            {accent && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={!!item.accent}
                  onChange={(e) => update({ accent: e.target.checked })}
                  className="h-4 w-4 accent-red-600"
                />
                Kırmızı vurgula (kampanya)
              </label>
            )}
          </div>
        )}
      />
      {/* The other way in: straight from the catalog, linked by its slug. */}
      <select
        value=""
        disabled={items.length >= max || categories.length === 0}
        aria-label="Var olan kategorilerden ekle"
        onChange={(e) => {
          if (e.target.value) onChange([...items, { label: "", slug: e.target.value }]);
        }}
        className={`${adminSelectClass} h-10 max-w-sm`}
      >
        <option value="">＋ Var olan kategorilerden seç…</option>
        {categoryOptions(categories).map((c) => (
          <option key={c.id} value={c.slug}>
            {c.parent_id !== null ? "— " : ""}
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function NavigationTab({
  value,
  set,
  categories,
  brands,
}: {
  value: Homepage["navigation"];
  set: Set<"navigation">;
  categories: Category[];
  brands: Brand[];
}) {
  const auto = value.sidebar_mode === "auto";
  const preview = autoSidebar(categories);
  const modeButton = (mode: "auto" | "custom", title: string, hint: string) => {
    const active = value.sidebar_mode === mode;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => set({ ...value, sidebar_mode: mode })}
        className={`flex-1 rounded-xl border p-3 text-left transition-colors ${
          active
            ? "border-red-500 bg-red-50 dark:bg-red-500/10"
            : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
        }`}
      >
        <span className={`block text-sm font-semibold ${active ? "text-red-700 dark:text-red-300" : ""}`}>{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
      </button>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Üst menü çubuğu" hint="“KATAGORİLER” düğmesinin yanındaki beyaz butonlar. En fazla 12.">
        <NavList
          items={value.top}
          onChange={(top) => set({ ...value, top })}
          max={12}
          accent
          categories={categories}
          brands={brands}
        />
      </Panel>
      <Panel title="Sol kategori menüsü" hint="Ana sayfa ve katalogdaki kategori sütunu.">
        <div role="radiogroup" aria-label="Sol menü modu" className="flex flex-col gap-2 sm:flex-row">
          {modeButton("auto", "Otomatik", "Tüm aktif kategoriler, Menü & Kategoriler’deki sırayla. Yeni kategori kendiliğinden eklenir.")}
          {modeButton("custom", "Özel sıralama", "Kategorileri, markaları ve özel bağlantıları kendiniz seçip sıralayın.")}
        </div>
        {auto ? (
          <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p className="mb-3 text-xs text-slate-500 dark:text-zinc-400">
              Şu an gösterilecek {preview.length} kategori. Eklemek, yeniden adlandırmak, sıralamak veya gizlemek için{" "}
              <Link href="/admin/categories" className="font-medium text-red-600 hover:underline dark:text-red-400">
                Menü & Kategoriler
              </Link>
              ’e gidin.
            </p>
            <ul className="space-y-1.5">
              {preview.map((item, i) => (
                <li
                  key={`${item.href}-${i}`}
                  className={`rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider dark:border-white/10 dark:bg-zinc-900 ${item.depth ? "ml-4" : ""}`}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <NavList
            items={value.sidebar}
            onChange={(sidebar) => set({ ...value, sidebar })}
            max={30}
            accent={false}
            categories={categories}
            brands={brands}
          />
        )}
      </Panel>
    </div>
  );
}

// ── Hero & kutular: their own editors ────────────────────────────────────────

const editorLink =
  "group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-red-400/60 dark:border-white/10 dark:bg-zinc-900/60";

export function HeroTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/admin/hero" className={editorLink}>
        <GalleryHorizontal className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <span>
          <span className="flex items-center gap-1 font-semibold">
            Hero Slider <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="mt-1 block text-sm text-slate-500 dark:text-zinc-400">
            Slayt başlıkları, alt metinler ve butonlar; metin hizası (sol / orta / sağ); görsel yükleme, odak noktası ve
            yakınlaştırma ile kırpma.
          </span>
        </span>
      </Link>
      <Link href="/admin/promos" className={editorLink}>
        <LayoutGrid className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <span>
          <span className="flex items-center gap-1 font-semibold">
            Kategori Kutuları <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="mt-1 block text-sm text-slate-500 dark:text-zinc-400">
            Slider’ın altındaki iki sıra kutu: görsel, başlık, açıklama ve bağlantı.
          </span>
        </span>
      </Link>
    </div>
  );
}

// ── Fırsatlar & Markalar ─────────────────────────────────────────────────────

export function DealsTab({ value, set }: { value: Homepage["deals"]; set: Set<"deals"> }) {
  return (
    <Panel title="Fırsatları Kaçırma" hint="Kırmızı vitrinin başlığı ve altındaki satır. Ürünler “Fırsat Ürünleri”nden gelir.">
      <TextField label="Başlık" value={value.title} max={60} onChange={(title) => set({ ...value, title })} />
      <TextArea label="Alt metin" value={value.subtitle} max={200} rows={2} onChange={(subtitle) => set({ ...value, subtitle })} />
    </Panel>
  );
}

export function BrandsTab({ value, set }: { value: Homepage["brands"]; set: Set<"brands"> }) {
  return (
    <Panel title="Markalar Şeridi" hint="Kapsülde kayan marka adları, bu sırayla. En fazla 40.">
      <StringList
        items={value.items}
        onChange={(items) => set({ items })}
        max={40}
        maxLength={40}
        addLabel="Marka ekle"
        placeholder="ör. Oduman"
      />
    </Panel>
  );
}

// ── Premium Ürün Yelpazesi ───────────────────────────────────────────────────

export function ShowcaseTab({
  value,
  set,
  categories,
  brands,
}: {
  value: Homepage["showcase"];
  set: Set<"showcase">;
  categories: Category[];
  brands: Brand[];
}) {
  return (
    <div className="space-y-6">
      <Panel title="Başlık">
        <TextField label="Başlık" value={value.title} max={80} onChange={(title) => set({ ...value, title })} />
        <TextArea label="Alt metin (isteğe bağlı)" value={value.subtitle} max={240} rows={2} onChange={(subtitle) => set({ ...value, subtitle })} />
      </Panel>
      <Panel title="Kutular" hint="Geniş kutu iki sütun kaplar. Görsel boşsa kategoriden bir ürün fotoğrafı kullanılır.">
        <ListEditor
          items={value.tiles}
          onChange={(tiles) => set({ ...value, tiles })}
          blank={(): HomeShowcaseTile => ({ label: "Yeni kutu", eyebrow: "", wide: false, icon: "package", href: "/catalog" })}
          max={24}
          addLabel="Kutu ekle"
          itemLabel={(t) => `${t.label}${t.wide ? " · geniş" : ""}`}
          render={(tile, update) => (
            <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Başlık" value={tile.label} max={80} onChange={(label) => update({ label })} />
                  <TextField label="Kırmızı üst etiket" value={tile.eyebrow} max={40} onChange={(eyebrow) => update({ eyebrow })} />
                </div>
                <NavTargetFields item={tile} update={update} categories={categories} brands={brands} />
                <div className="grid items-end gap-3 sm:grid-cols-2">
                  <IconSelect value={tile.icon} onChange={(icon) => update({ icon })} />
                  <label className="flex h-10 items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={tile.wide}
                      onChange={(e) => update({ wide: e.target.checked })}
                      className="h-4 w-4 accent-red-600"
                    />
                    Geniş kutu (2 sütun)
                  </label>
                </div>
              </div>
              <ImageField label="Görsel" value={tile.image} onChange={(image) => update({ image })} hint="Boş: kategoriden otomatik." />
            </div>
          )}
        />
      </Panel>
    </div>
  );
}

// ── Ayrıcalıklar & Avantajlar ────────────────────────────────────────────────

export function AdvantagesTab({ value, set }: { value: Homepage["advantages"]; set: Set<"advantages"> }) {
  return (
    <div className="space-y-6">
      <Panel title="Başlık" hint="Ana sayfada ve kategori sayfalarının altında aynı kartlar gösterilir.">
        <TextField label="Kırmızı etiket" value={value.eyebrow} max={60} onChange={(eyebrow) => set({ ...value, eyebrow })} />
        <TextField label="Başlık" value={value.title} max={80} onChange={(title) => set({ ...value, title })} />
        <TextArea label="Alt metin" value={value.subtitle} max={240} rows={2} onChange={(subtitle) => set({ ...value, subtitle })} />
      </Panel>
      <Panel title="Kartlar" hint="Ücretsiz kargo, ciro ve havale oranları ödeme adımının uyguladığı kurallardır; metni değiştirmek kuralı değiştirmez.">
        <ListEditor
          items={value.cards}
          onChange={(cards) => set({ ...value, cards })}
          blank={(): HomeAdvantageCard => ({ badge: "", title: "Yeni avantaj", description: "", note: "", icon: "badge-check", image: null })}
          max={12}
          addLabel="Kart ekle"
          itemLabel={(c) => c.title}
          render={(card, update) => (
            <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Kırmızı rozet" value={card.badge} max={30} onChange={(badge) => update({ badge })} />
                  <TextField label="Başlık" value={card.title} max={80} onChange={(title) => update({ title })} />
                </div>
                <TextArea label="Açıklama" value={card.description} max={240} rows={2} onChange={(description) => update({ description })} />
                <TextField label="Dipnot" value={card.note} max={200} onChange={(note) => update({ note })} />
                <IconSelect value={card.icon} onChange={(icon) => update({ icon })} />
              </div>
              <ImageField label="Görsel" value={card.image} onChange={(image) => update({ image })} hint="Dikey (4:5) fotoğraf en iyisi." />
            </div>
          )}
        />
      </Panel>
    </div>
  );
}

// ── Hakkımızda ───────────────────────────────────────────────────────────────

export function AboutTab({ value, set }: { value: Homepage["about"]; set: Set<"about"> }) {
  return (
    <div className="space-y-6">
      <Panel title="Rakamlar" hint="Sol taraftaki kutular, ör. “17+ · Yıllık Tecrübe”. En fazla 6.">
        <ListEditor
          items={value.stats}
          onChange={(stats) => set({ ...value, stats })}
          blank={() => ({ value: "", label: "" })}
          max={6}
          addLabel="Rakam ekle"
          itemLabel={(s) => [s.value, s.label].filter(Boolean).join(" · ") || "(boş)"}
          render={(stat, update) => (
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <TextField label="Değer" value={stat.value} max={12} onChange={(v) => update({ value: v })} placeholder="17+" />
              <TextField label="Açıklama" value={stat.label} max={40} onChange={(label) => update({ label })} placeholder="Yıllık Tecrübe" />
            </div>
          )}
        />
      </Panel>
      <Panel title="Kurumsal metin" hint="Tırnak işaretiyle açılan paragraf.">
        <TextArea label="Metin" value={value.text} max={1500} rows={6} onChange={(text) => set({ ...value, text })} />
      </Panel>
      <Panel title="Güvence rozetleri" hint="Alt satırdaki onay işaretli ifadeler. En fazla 6.">
        <StringList items={value.badges} onChange={(badges) => set({ ...value, badges })} max={6} maxLength={40} addLabel="Rozet ekle" />
      </Panel>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

const SOCIAL_KINDS: { value: HomeSocialKind; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "link", label: "Diğer" },
];

function FooterColumnEditor({
  title,
  column,
  onChange,
  withCta,
}: {
  title: string;
  column: HomeFooterColumn;
  onChange: (column: HomeFooterColumn) => void;
  withCta: boolean;
}) {
  return (
    <Panel title={title}>
      <TextField label="Kolon başlığı" value={column.title} max={40} onChange={(t) => onChange({ ...column, title: t })} />
      <ListEditor
        items={column.links}
        onChange={(links) => onChange({ ...column, links })}
        blank={() => ({ label: "Yeni bağlantı", href: "/" })}
        max={10}
        addLabel="Bağlantı ekle"
        itemLabel={(l) => l.label}
        render={(link, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Metin" value={link.label} max={120} onChange={(label) => update({ label })} />
            <TextField label="Bağlantı" value={link.href} max={300} onChange={(href) => update({ href })} placeholder="/sss veya https://…" />
          </div>
        )}
      />
      {withCta && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Alt buton metni"
            value={column.cta_label}
            max={40}
            onChange={(cta_label) => onChange({ ...column, cta_label })}
            hint="Boş bırakılırsa buton gösterilmez."
          />
          <TextField
            label="Alt buton bağlantısı"
            value={column.cta_href ?? ""}
            max={300}
            onChange={(href) => onChange({ ...column, cta_href: href || null })}
          />
        </div>
      )}
    </Panel>
  );
}

export function FooterTab({ value, set }: { value: Homepage["footer"]; set: Set<"footer"> }) {
  const patch = (p: Partial<Homepage["footer"]>) => set({ ...value, ...p });
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Marka & iletişim" hint="Telefon, e-posta ve WhatsApp üstteki üç iletişim kartında da kullanılır.">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Marka adı" value={value.brand_name} max={40} onChange={(brand_name) => patch({ brand_name })} />
            <TextField label="Alt etiket" value={value.tagline} max={60} onChange={(tagline) => patch({ tagline })} />
            <TextField label="Telefon" value={value.phone} max={30} onChange={(phone) => patch({ phone })} />
            <TextField label="E-posta" value={value.email} max={120} onChange={(email) => patch({ email })} />
          </div>
          <TextField
            label="WhatsApp bağlantısı"
            value={value.whatsapp_href}
            max={300}
            onChange={(whatsapp_href) => patch({ whatsapp_href })}
            placeholder="https://wa.me/905xxxxxxxxx"
          />
          <TextField label="Çalışma saatleri" value={value.hours} max={120} onChange={(hours) => patch({ hours })} />
        </Panel>
        <Panel title="Şubeler" hint="Adres blokları, bu sırayla. En fazla 6.">
          <ListEditor
            items={value.branches}
            onChange={(branches) => patch({ branches })}
            blank={() => ({ name: "", address: "" })}
            max={6}
            addLabel="Şube ekle"
            itemLabel={(b) => b.name || "(adsız)"}
            render={(branch, update) => (
              <div className="space-y-3">
                <TextField label="Şube adı" value={branch.name} max={40} onChange={(name) => update({ name })} />
                <TextArea label="Adres" value={branch.address} max={200} rows={2} onChange={(address) => update({ address })} />
              </div>
            )}
          />
        </Panel>
      </div>

      <Panel title="Sosyal medya" hint="Şubelerin altındaki bağlantılar. En fazla 8.">
        <ListEditor
          items={value.social}
          onChange={(social) => patch({ social })}
          blank={(): Homepage["footer"]["social"][number] => ({ label: "", href: "https://", kind: "link" })}
          max={8}
          addLabel="Bağlantı ekle"
          itemLabel={(s) => s.label || "(adsız)"}
          render={(social, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_10rem]">
              <TextField label="Metin" value={social.label} max={40} onChange={(label) => update({ label })} />
              <TextField label="Bağlantı" value={social.href} max={300} onChange={(href) => update({ href })} />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Simge
                  <select
                    value={social.kind}
                    onChange={(e) => update({ kind: e.target.value as HomeSocialKind })}
                    className={`${adminSelectClass} mt-1 h-10`}
                  >
                    {SOCIAL_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <FooterColumnEditor title="Blog kolonu" column={value.blog} onChange={(blog) => patch({ blog })} withCta />
        <FooterColumnEditor title="Bilgi Sayfaları kolonu" column={value.info} onChange={(info) => patch({ info })} withCta />
        <FooterColumnEditor title="Destek & S.S.S kolonu" column={value.faq} onChange={(faq) => patch({ faq })} withCta />
      </div>

      <Panel title="Alt satır">
        <TextField
          label="Telif metni"
          value={value.copyright}
          max={120}
          onChange={(copyright) => patch({ copyright })}
          hint="Başına “© {yıl}” otomatik eklenir."
        />
        <TextField label="Fiyat notu" value={value.price_note} max={200} onChange={(price_note) => patch({ price_note })} />
        <TextField label="Yasal uyarı" value={value.warning} max={200} onChange={(warning) => patch({ warning })} />
      </Panel>
    </div>
  );
}
