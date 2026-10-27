"use client";

import { useState, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { ArrowUpRight, GalleryHorizontal, GripVertical, LayoutGrid, Lock, Pencil, Plus, RotateCcw, Tags, Timer } from "lucide-react";

import { adminSelectClass } from "@/components/admin/ContentEditor";
import { CategoryMenuEditor } from "@/components/admin/homepage/CategoryMenuEditor";
import {
  IconSelect,
  ImageField,
  ListEditor,
  LinkField,
  Panel,
  TextArea,
  TextField,
} from "@/components/admin/homepage/fields";
import { Switch } from "@/components/ui/Switch";
import { HOME_BLOCKS } from "@/lib/homeBlocks";
import { DEFAULT_SEO_INTRO, MOBILE_SECTION_LABELS, SECTION_LABELS } from "@/lib/homepage";
import {
  canWiden,
  isPlaceholderTitle,
  placeShowcase,
  SHOWCASE_COLUMNS,
  SHOWCASE_SLOTS,
  showcaseProblem,
  showcaseSlotsUsed,
} from "@/lib/showcase";
import { navHref } from "@/lib/storefrontNav";
import type {
  Brand,
  Category,
  HomeBlock,
  Homepage,
  HomeFooterColumn,
  HomeSections,
  HomeShowcaseTile,
  HomeSocialKind,
} from "@/types";

type Set<K extends keyof Homepage> = (value: Homepage[K]) => void;

// ── Bölümler: the master switches, and the order ─────────────────────────────

type SectionsBusy = keyof HomeSections | "order" | null;

/** One section's row: its handle (or lock), its place, its name, its settings, its switch. */
function SectionRow({
  id,
  place,
  on,
  busy,
  onToggle,
  onEdit,
  changed,
  handle,
}: {
  id: keyof HomeSections;
  place: number | null;
  on: boolean;
  busy: boolean;
  onToggle: (key: keyof HomeSections, on: boolean) => void;
  /** Opens the section's settings; absent for a section with nothing to set. */
  onEdit?: () => void;
  /** Its settings have edits not saved yet. */
  changed?: boolean;
  /** The drag handle; a pinned section shows a lock instead. */
  handle: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {handle}
      <span className="w-5 shrink-0 text-right font-mono text-xs text-slate-400 tabular-nums dark:text-zinc-500">
        {place ?? ""}
      </span>
      <div className="min-w-0 flex-1">
        <p id={`section-${id}`} className="text-sm font-semibold">
          {SECTION_LABELS[id].title}
          {!on && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-zinc-400">
              Gizli
            </span>
          )}
          {changed && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              Kaydedilmedi
            </span>
          )}
        </p>
        <p id={`section-${id}-hint`} className="text-xs text-slate-500 dark:text-zinc-400">
          {SECTION_LABELS[id].hint}
        </p>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Düzenle: ${SECTION_LABELS[id].title}`}
          title="Bölümün ayarları"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        // Keeps the switches in one column.
        <span className="w-9 shrink-0" aria-hidden />
      )}
      <Switch
        checked={on}
        onChange={(next) => onToggle(id, next)}
        labelledBy={`section-${id}`}
        describedBy={`section-${id}-hint`}
        disabled={busy}
      />
    </div>
  );
}

function Pinned({ title }: { title: string }) {
  return (
    <span title={title} className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-300 dark:text-zinc-600">
      <Lock className="h-4 w-4" aria-hidden />
      <span className="sr-only">{title}</span>
    </span>
  );
}

function SortableSection({ disabled, ...props }: Omit<Parameters<typeof SectionRow>[0], "handle"> & { id: HomeBlock; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    disabled,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative bg-white dark:bg-zinc-900 ${isDragging ? "z-10 rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-white/10" : ""}`}
    >
      <SectionRow
        {...props}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Taşı: ${SECTION_LABELS[props.id].title}`}
            className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-red-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        }
      />
    </li>
  );
}

/**
 * "Bölümler": every section of the homepage, in the order the storefront
 * shows it, each with its switch. The hero stays first and the footer last
 * (the hero holds the page's heading and the category column; the footer is
 * every page's); everything between them moves by its handle — with the
 * mouse, a finger, or the keyboard (space, the arrows, space). A switch or a
 * move saves at once, as the switches always have. A section with settings
 * of its own has a pencil beside its switch, which opens them (`onEdit`).
 */
export function SectionsTab({
  sections,
  order,
  busy,
  onToggle,
  onReorder,
  onEdit,
  changed,
}: {
  sections: HomeSections;
  order: HomeBlock[];
  busy: SectionsBusy;
  onToggle: (key: keyof HomeSections, on: boolean) => void;
  /** Saves an order; false when it could not, and the list goes back. */
  onReorder: (order: HomeBlock[]) => Promise<boolean>;
  /** The settings opener of each section that has some. */
  onEdit: (key: keyof HomeSections) => (() => void) | undefined;
  /** Whether a section's settings have unsaved edits. */
  changed: (key: keyof HomeSections) => boolean;
}) {
  // Moved on screen at once, saved behind it; a newly saved order replaces it.
  const [items, setItems] = useState(order);
  const [shown, setShown] = useState(order);
  if (order !== shown) {
    setShown(order);
    setItems(order);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const isDefault = items.every((id, i) => id === HOME_BLOCKS[i]);

  async function move(next: HomeBlock[]) {
    setItems(next);
    if (!(await onReorder(next))) setItems(order);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.indexOf(active.id as HomeBlock);
    const to = items.indexOf(over.id as HomeBlock);
    void move(arrayMove(items, from, to));
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${SECTION_LABELS[active.id as HomeBlock].title} tutuldu.`,
    onDragOver: ({ active, over }) =>
      over ? `${SECTION_LABELS[active.id as HomeBlock].title}, ${items.indexOf(over.id as HomeBlock) + 2}. sırada.` : "",
    onDragEnd: ({ active, over }) =>
      over ? `${SECTION_LABELS[active.id as HomeBlock].title} ${items.indexOf(over.id as HomeBlock) + 2}. sıraya bırakıldı.` : "",
    onDragCancel: ({ active }) => `${SECTION_LABELS[active.id as HomeBlock].title} yerinde kaldı.`,
  };

  return (
    <Panel
      title="Bölümler"
      hint="Tutamaçtan sürükleyerek sıralayın (klavyeyle: boşluk, oklar, boşluk); kalemle bölümün ayarlarını açın. Her anahtar ve her taşıma anında kaydedilir ve mağazada hemen uygulanır."
      action={
        <button
          type="button"
          disabled={isDefault || busy !== null}
          onClick={() => void move([...HOME_BLOCKS])}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Varsayılan sıraya döndür
        </button>
      }
    >
      <div className="divide-y divide-slate-200 dark:divide-white/10">
        <SectionRow
          id="hero"
          place={1}
          on={sections.hero}
          busy={busy !== null}
          onToggle={onToggle}
          onEdit={onEdit("hero")}
          changed={changed("hero")}
          handle={<Pinned title="Hep en üstte" />}
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable: "Taşımak için boşluk tuşuna basın, okla yer değiştirin, bırakmak için yeniden boşluğa basın; vazgeçmek için Escape.",
            },
          }}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {items.map((id, i) => (
                <SortableSection
                  key={id}
                  id={id}
                  place={i + 2}
                  on={sections[id]}
                  busy={busy !== null}
                  disabled={busy !== null}
                  onToggle={onToggle}
                  onEdit={onEdit(id)}
                  changed={changed(id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <SectionRow
          id="footer"
          place={null}
          on={sections.footer}
          busy={busy !== null}
          onToggle={onToggle}
          onEdit={onEdit("footer")}
          changed={changed("footer")}
          handle={<Pinned title="Hep en altta (tüm sayfalarda)" />}
        />
      </div>
    </Panel>
  );
}

// ── Kategori Düzenle ─────────────────────────────────────────────────────────

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
  return (
    <div className="grid items-start gap-6 @4xl:grid-cols-2">
      <Panel
        title="Sol Kategori"
        hint="Slider’ın yanındaki dikey kategori sütunu (kategori sayfalarında da). En fazla 30."
      >
        <CategoryMenuEditor
          items={value.sidebar}
          onChange={(sidebar) => set({ ...value, sidebar })}
          max={30}
          accent={false}
          categories={categories}
          brands={brands}
        />
      </Panel>
      <Panel title="Üst Kategori" hint="Slider’ın üstündeki yatay buton çubuğu. En fazla 12.">
        <CategoryMenuEditor
          items={value.top}
          onChange={(top) => set({ ...value, top })}
          max={12}
          accent
          categories={categories}
          brands={brands}
        />
      </Panel>
    </div>
  );
}

// ── Hero & kutular: their own editors ────────────────────────────────────────

const editorLink =
  "group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-red-400/60 dark:border-white/10 dark:bg-zinc-900/60";

export function HeroTab() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <Link href="/admin/hero" className={editorLink}>
        <GalleryHorizontal className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <span>
          <span className="flex items-center gap-1 font-semibold">
            Hero Slider{" "}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
            Promo Kutusu{" "}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="mt-1 block text-sm text-slate-500 dark:text-zinc-400">
            Slider’ın yanındaki iki kart: Topluluk (Instagram, YouTube bağlantıları) ve Ayrıcalıklar & Avantajlar.
          </span>
        </span>
      </Link>
    </div>
  );
}

// ── Fırsatlar & Markalar ─────────────────────────────────────────────────────

/** A card into one of the editors that live on their own page. */
function EditorLink({ href, title, text, Icon }: { href: string; title: string; text: string; Icon: typeof Timer }) {
  return (
    <Link href={href} className={editorLink}>
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
      <span>
        <span className="flex items-center gap-1 font-semibold">
          {title} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-zinc-400">{text}</span>
      </span>
    </Link>
  );
}

export function DealsTab({ value, set }: { value: Homepage["deals"]; set: Set<"deals"> }) {
  return (
    <div className="space-y-6">
      <EditorLink
        href="/admin/flash-sales"
        title="Fırsat Ürünleri"
        text="Vitrinde hangi ürünlerin, hangi fırsat fiyatı ve bitiş tarihiyle görüneceği."
        Icon={Timer}
      />
      <Panel title="Fırsatları Kaçırma" hint="Kırmızı vitrinin başlığı ve altındaki satır.">
        <TextField label="Başlık" value={value.title} max={60} onChange={(title) => set({ ...value, title })} />
        <TextArea
          label="Alt metin"
          value={value.subtitle}
          max={200}
          rows={2}
          onChange={(subtitle) => set({ ...value, subtitle })}
        />
      </Panel>
    </div>
  );
}

/** The ticker shows the brands list ("Markalar") itself: edited there, previewed here. */
export function BrandsTab({ brands }: { brands: Brand[] }) {
  const shown = brands.filter((b) => b.is_active);
  return (
    <div className="space-y-6">
      <EditorLink
        href="/admin/products?sekme=markalar"
        title="Markalar"
        text="Şerit, Markalar sayfasındaki yayındaki markaları oradaki sırayla kaydırır: logosu olan logosuyla, olmayan adıyla. Her biri kendi marka sayfasına bağlanır."
        Icon={Tags}
      />
      <Panel title="Şeritte görünenler" hint={`${shown.length} marka, bu sırayla. Eklemek, çıkarmak ya da sıralamak için Markalar sayfasını kullanın.`}>
        {shown.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">Yayında marka yok: şerit gizlenir.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {shown.map((b) => (
              <li
                key={b.id}
                className="flex h-10 items-center rounded-lg bg-slate-50 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10"
              >
                {b.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a small uploaded logo
                  <img src={b.logo_url} alt={b.name} title={b.name} className="h-6 w-auto max-w-24 object-contain grayscale" />
                ) : (
                  b.name
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Premium Ürün Yelpazesi ───────────────────────────────────────────────────

const blankTile = (): HomeShowcaseTile => ({
  label: "Yeni kutu",
  eyebrow: "",
  wide: false,
  icon: "package",
  href: "/catalog",
});

/**
 * The desktop grid in miniature: two rows of four slots, each tile on its
 * number (two slots for a wide one), the free slots dashed — so the editor
 * sees where a tile lands before saving.
 */
function ShowcaseGridMap({ tiles }: { tiles: HomeShowcaseTile[] }) {
  const shown = tiles.flatMap((tile, index) => (tile.enabled === false ? [] : [{ tile, index }]));
  const slots = placeShowcase(shown.map((t) => t.tile));
  const free = Math.max(0, SHOWCASE_SLOTS - slots.reduce((sum, s) => sum + s.span, 0));
  return (
    <div aria-hidden className="grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-2 dark:bg-white/5">
      {shown.map(({ tile, index }, i) => (
        <div
          key={index}
          className={`flex h-10 min-w-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium ${
            slots[i].span === 2 ? "col-span-2" : ""
          } ${
            slots[i].row >= 2 || slots[i].narrowed
              ? "bg-red-100 text-red-700 ring-1 ring-red-400 dark:bg-red-500/15 dark:text-red-300"
              : isPlaceholderTitle(tile.label)
                ? "bg-slate-300 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                : "bg-neutral-800 text-white dark:bg-zinc-700"
          }`}
        >
          <span className="font-mono opacity-70">{String(index + 1).padStart(2, "0")}</span>
          <span className="truncate">{tile.label}</span>
        </div>
      ))}
      {Array.from({ length: free }, (_, i) => (
        <div key={`free-${i}`} className="h-10 rounded-md border border-dashed border-slate-300 dark:border-white/15" />
      ))}
    </div>
  );
}

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
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  const problem = showcaseProblem(value.tiles);
  // Room for another square: a free slot, in a list of at most eight.
  const used = showcaseSlotsUsed(value.tiles.filter((t) => t.enabled !== false));
  const max = Math.min(SHOWCASE_SLOTS, value.tiles.length + Math.max(0, SHOWCASE_SLOTS - used));
  const add = () => set({ ...value, tiles: [...value.tiles, blankTile()] });
  return (
    <div className="space-y-6">
      <Panel title="Başlık">
        <TextField label="Başlık" value={value.title} max={80} onChange={(title) => set({ ...value, title })} />
        <TextArea
          label="Alt metin (isteğe bağlı)"
          value={value.subtitle}
          max={240}
          rows={2}
          onChange={(subtitle) => set({ ...value, subtitle })}
        />
      </Panel>
      <Panel
        title="Kutular"
        hint={`Masaüstünde satır başına ${SHOWCASE_COLUMNS} yer, en fazla 2 satır (${SHOWCASE_SLOTS} yer). Geniş kutu 2 yer kaplar; bir satırda en fazla bir geniş kutu olur. Yeni kutu, başlığı girilince sitede görünür. Görsel boşsa, bağlantı bir kategori sayfasıysa (/catalog/…) o kategorinin kapak ya da ürün fotoğrafı kullanılır.`}
        action={
          <button
            type="button"
            onClick={add}
            disabled={value.tiles.length >= max}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Yeni Kutu
            <span className="text-xs font-normal text-white/80">
              ({used}/{SHOWCASE_SLOTS} yer)
            </span>
          </button>
        }
      >
        <ShowcaseGridMap tiles={value.tiles} />
        {problem && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {problem}
          </p>
        )}
        <ListEditor
          items={value.tiles}
          onChange={(tiles) => set({ ...value, tiles })}
          blank={blankTile}
          max={max}
          addLabel="Yeni Kutu"
          itemLabel={(t) =>
            `${t.label}${t.wide ? " · geniş" : ""}${isPlaceholderTitle(t.label) ? " · başlık girilene kadar sitede görünmez" : ""}`
          }
          render={(tile, update, index) => {
            const widenable = tile.wide || canWiden(value.tiles, index);
            return (
              <div className="grid gap-3 @2xl:grid-cols-[1fr_16rem]">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Başlık" value={tile.label} max={80} onChange={(label) => update({ label })} />
                    <TextField
                      label="Kırmızı üst etiket"
                      value={tile.eyebrow}
                      max={40}
                      onChange={(eyebrow) => update({ eyebrow })}
                    />
                  </div>
                  <LinkField
                    categories={categories}
                    value={tile.href ?? navHref(tile, bySlug, brandBySlug)}
                    onChange={(href) => update({ slug: null, brand: null, search: null, href })}
                  />
                  <div className="grid items-end gap-3 sm:grid-cols-2">
                    <IconSelect value={tile.icon} onChange={(icon) => update({ icon })} />
                    <label
                      className={`flex h-10 items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 ${widenable ? "" : "opacity-50"}`}
                      title={widenable ? undefined : "Bu satırda geniş kutuya yer yok."}
                    >
                      <input
                        type="checkbox"
                        checked={tile.wide}
                        disabled={!widenable}
                        onChange={(e) => update({ wide: e.target.checked })}
                        className="h-4 w-4 accent-red-600"
                      />
                      Geniş kutu (2 sütun)
                    </label>
                  </div>
                </div>
                <ImageField
                  label="Görsel"
                  value={tile.image}
                  onChange={(image) => update({ image })}
                  hint="Boş: kategoriden otomatik."
                />
              </div>
            );
          }}
        />
      </Panel>
    </div>
  );
}

// ── Alt SEO Metni ────────────────────────────────────────────────────────────

/**
 * "Alt SEO Tanıtım Metni": the passage that closes the homepage and every
 * catalog page above the footer. An empty field shows the shop's own copy for
 * it, so clearing one is how it goes back to the default.
 */
export function SeoIntroTab({ value, set }: { value: Homepage["seo_intro"]; set: Set<"seo_intro"> }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Alt SEO Tanıtım Metni (Footer SEO)"
        hint="Ana sayfanın ve tüm kategori sayfalarının en altında, footer'ın hemen üstünde. Boş bırakılan alan varsayılan metni gösterir."
      >
        <div className="space-y-4">
          <TextField
            label="Başlık"
            value={value.title}
            max={150}
            onChange={(title) => set({ ...value, title })}
            placeholder={DEFAULT_SEO_INTRO.title}
          />
          <TextArea
            label="Özet (her zaman görünen paragraf)"
            value={value.summary}
            max={1500}
            rows={4}
            onChange={(summary) => set({ ...value, summary })}
          />
          <TextArea
            label="Devamı (“Devamını Oku” ile açılan metin)"
            hint="Boş bir satır yeni paragraf başlatır. Metin kapalıyken de sayfada bulunur; arama motorları okur."
            value={value.content}
            max={6000}
            rows={10}
            onChange={(content) => set({ ...value, content })}
          />
        </div>
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
      <TextField
        label="Kolon başlığı"
        value={column.title}
        max={40}
        onChange={(t) => onChange({ ...column, title: t })}
      />
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
            <TextField
              label="Bağlantı"
              value={link.href}
              max={300}
              onChange={(href) => update({ href })}
              placeholder="/sss veya https://…"
            />
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
      <div className="grid gap-6 @4xl:grid-cols-2">
        <Panel title="Marka & iletişim" hint="Telefon, e-posta ve WhatsApp üstteki üç iletişim kartında da kullanılır.">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Marka adı"
              value={value.brand_name}
              max={40}
              onChange={(brand_name) => patch({ brand_name })}
            />
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
                <TextArea
                  label="Adres"
                  value={branch.address}
                  max={200}
                  rows={2}
                  onChange={(address) => update({ address })}
                />
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

      <div className="grid gap-6 @5xl:grid-cols-3">
        <FooterColumnEditor title="Blog kolonu" column={value.blog} onChange={(blog) => patch({ blog })} withCta />
        <FooterColumnEditor
          title="Bilgi Sayfaları kolonu"
          column={value.info}
          onChange={(info) => patch({ info })}
          withCta
        />
        <FooterColumnEditor
          title="Destek & S.S.S kolonu"
          column={value.faq}
          onChange={(faq) => patch({ faq })}
          withCta
        />
      </div>

      <Panel title="Alt satır">
        <TextField
          label="Telif metni"
          value={value.copyright}
          max={120}
          onChange={(copyright) => patch({ copyright })}
          hint="Başına “© {yıl}” otomatik eklenir."
        />
        <TextField
          label="Fiyat notu"
          value={value.price_note}
          max={200}
          onChange={(price_note) => patch({ price_note })}
        />
        <TextField label="Yasal uyarı" value={value.warning} max={200} onChange={(warning) => patch({ warning })} />
      </Panel>
    </div>
  );
}

// ── Mobil Yönetim ────────────────────────────────────────────────────────────

/**
 * "Mobil Yönetim": the sections a phone can go without (hidden below `md`
 * only). Saved with the rest of the document ("Kaydet"), like every editor
 * but "Bölümler". A hero slide's phone photo and design are its own, in
 * /admin/hero's "Mobil" view.
 */
export function MobileTab({ value, set }: { value: Homepage["mobile"]; set: Set<"mobile"> }) {
  // Kept in page order, whatever order they were switched in.
  const setHidden = (key: Homepage["mobile"]["hidden"][number], hide: boolean) =>
    set({
      ...value,
      hidden: MOBILE_SECTION_LABELS.map((l) => l.key).filter((k) => (k === key ? hide : value.hidden.includes(k))),
    });

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400">
        Slaytların telefon görseli ve yerleşimi artık{" "}
        <Link href="/admin/hero" className="font-medium text-red-600 hover:underline dark:text-red-400">
          Hero Slider
        </Link>{" "}
        sayfasında, her slaytın “Mobil” görünümünde düzenlenir.
      </p>
      <Panel
        title="Mobilde Gizlenecek Bölümler"
        hint="Yalnızca telefonda (768px altı) gizlenir; tablet ve masaüstü değişmez. “Kaydet” ile uygulanır."
      >
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {MOBILE_SECTION_LABELS.map(({ key, title, hint }) => (
            <li key={key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div>
                <p id={`mobile-${key}`} className="text-sm font-semibold">
                  {title}
                </p>
                <p id={`mobile-${key}-hint`} className="text-xs text-slate-500 dark:text-zinc-400">
                  {hint}
                </p>
              </div>
              <Switch
                checked={value.hidden.includes(key)}
                onChange={(hide) => setHidden(key, hide)}
                labelledBy={`mobile-${key}`}
                describedBy={`mobile-${key}-hint`}
              />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
