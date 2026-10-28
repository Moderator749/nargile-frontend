"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, UserX } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { Pagination } from "@/components/admin/Pagination";
import { SortableHeader, type SortState } from "@/components/admin/SortableHeader";
import { ACCOUNT_TYPE_LABELS, SEGMENT_LABELS, SegmentChip } from "@/components/admin/customers/CustomerLabels";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Alert } from "@/components/ui/Alert";
import { ADMIN_PAGE_SIZE, adminCustomerCities, adminListCustomersPage } from "@/lib/adminApi";
import { countryName } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import { whatsappHref } from "@/lib/whatsapp";
import type { AccountType, AdminCustomer, CustomerSort, SegmentType } from "@/types";

interface ListState {
  customers: AdminCustomer[];
  total: number;
  key: string;
  error?: string;
}

/** The four cards sign-up offers; the two legacy types are not worth a filter. */
const FILTERABLE_TYPES: AccountType[] = ["INDIVIDUAL", "CAFE", "TOBACCO_SHOP", "INTERNATIONAL"];
const SEGMENTS: SegmentType[] = ["RETAIL", "CAFE", "WHOLESALE", "DEALER"];

const selectClass =
  "h-10 shrink-0 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100";

const date = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Where the customer is, as the row says it: şehir / ilçe at home, the country
 * abroad — a foreign city means little next to "Germany", and the country is
 * what decides whether an order is an export at all.
 */
function place(customer: AdminCustomer): string | null {
  if (customer.country && customer.country !== "TR") return countryName(customer.country);
  return [customer.city, customer.district].filter(Boolean).join(" / ") || null;
}

/**
 * The number, and a way to use it. Most of these conversations happen on
 * WhatsApp, so the button is in the row rather than two clicks away; it is
 * absent when the number cannot be resolved to a country code.
 */
function Contact({ customer }: { customer: AdminCustomer }) {
  const href = whatsappHref(customer.phone);
  const name = customer.company_title || customer.full_name || customer.email;
  if (!customer.phone) return <span className="text-slate-400 dark:text-zinc-600">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-xs" title={customer.phone}>
        {customer.phone}
      </span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} ile WhatsApp'ta yaz`}
          title="WhatsApp ile yaz"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#25D366] transition-colors duration-200 hover:bg-[#25D366]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      )}
    </span>
  );
}

/**
 * Every registered account, in the same sortable, filterable, paged grid the
 * products page uses.
 *
 * A row shows what the shop knows a customer by — a firm's unvan over its
 * contact, a person's name over their order count — and what it takes to act on
 * them: which kind of account, where they are, a number to call with a WhatsApp
 * button beside it, which price list, since when. The e-mail address is on
 * their page, where it is read rather than scanned.
 */
export function AdminCustomersGrid() {
  const [query, setQuery] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [segment, setSegment] = useState<SegmentType | "">("");
  const [city, setCity] = useState("");
  // The cities customers are actually in; empty until they load, which just
  // leaves the filter showing "Tüm iller".
  const [cities, setCities] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<CustomerSort>>({ by: null, dir: "asc" });
  const [list, setList] = useState<ListState | null>(null);
  // The page belongs to one search/filter: a new one starts again at page 1.
  const [paging, setPaging] = useState<{ filter: string; page: number }>({ filter: "|", page: 0 });
  const tableTop = useRef<HTMLDivElement>(null);

  const filter = `${query}|${accountType}|${city}|${segment}|${sort.by ?? ""}|${sort.dir}`;
  const page = paging.filter === filter ? paging.page : 0;
  const key = `${filter}|${page}`;

  useEffect(() => {
    const controller = new AbortController();
    adminCustomerCities(controller.signal)
      .then(setCities)
      .catch(() => {
        // Non-critical: the filter simply offers nothing.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminListCustomersPage(
      { q: query, accountType, segment, city, page, orderBy: sort.by, orderDir: sort.dir },
      controller.signal,
    )
      .then(({ customers, total }) => setList({ customers, total, key }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setList({ customers: [], total: 0, key, error: getApiErrorMessage(err, "Müşteriler yüklenemedi.") });
        }
      });
    return () => controller.abort();
  }, [key, query, accountType, segment, city, page, sort.by, sort.dir]);

  function goTo(next: number) {
    setPaging({ filter, page: next });
    tableTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // The page already on screen stays, dimmed, while the next one loads.
  const current = list?.key === key ? list : null;
  const shown = current ?? list;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <CatalogSearch
          onSearch={setQuery}
          busy={!current && !!list}
          placeholder="Ad, ünvan veya e-posta"
          label="Müşteri ara"
          id="admin-customer-search"
        />
        <label className="sr-only" htmlFor="admin-account-type">
          Hesap türü
        </label>
        <select
          id="admin-account-type"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as AccountType | "")}
          className={selectClass}
        >
          <option value="">Tüm hesap türleri</option>
          {FILTERABLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="admin-city">
          İl
        </label>
        <select
          id="admin-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={selectClass}
        >
          <option value="">Tüm iller</option>
          {cities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="admin-segment">
          Fiyat grubu
        </label>
        <select
          id="admin-segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value as SegmentType | "")}
          className={selectClass}
        >
          <option value="">Tüm fiyat grupları</option>
          {SEGMENTS.map((code) => (
            <option key={code} value={code}>
              {SEGMENT_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div ref={tableTop} className={`${panelClass} scroll-mt-[calc(var(--header-height)+1rem)] overflow-hidden`}>
        {!shown ? (
          <div className="space-y-2 p-4" aria-busy>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
            ))}
          </div>
        ) : shown.error ? (
          <div className="p-4">
            <Alert variant="error">{shown.error}</Alert>
          </div>
        ) : shown.customers.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <UserX className="h-9 w-9 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">Eşleşen müşteri bulunamadı.</p>
          </div>
        ) : (
          <div className={`transition-opacity ${current ? "" : "opacity-60"}`}>
            {/* Percentage columns: everything fits at any width, with no
                horizontal scroll. */}
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  <SortableHeader column="name" label="Müşteri / Ünvan" sort={sort} onSort={setSort} className="w-[26%]" />
                  <th scope="col" className="w-[15%] px-3 py-3">
                    Hesap Türü
                  </th>
                  <th scope="col" className="w-[17%] px-3 py-3">
                    İl / İlçe
                  </th>
                  <th scope="col" className="w-[16%] px-3 py-3">
                    İletişim
                  </th>
                  <th scope="col" className="w-[12%] px-3 py-3">
                    Fiyat Grubu
                  </th>
                  <SortableHeader column="created" label="Kayıt Tarihi" sort={sort} onSort={setSort} align="right" className="w-[14%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {shown.customers.map((customer) => {
                  const title = customer.company_title || customer.full_name || customer.email;
                  const under = customer.company_title ? customer.full_name : null;
                  return (
                    <tr key={customer.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="group flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate font-medium transition-colors duration-200 group-hover:text-red-600 dark:group-hover:text-red-400"
                              title={title}
                            >
                              {title}
                              {customer.is_guest && (
                                <span className="ms-2 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                                  Misafir
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-zinc-500">
                              {under ?? `${customer.order_count} sipariş`}
                            </span>
                          </span>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-red-600 dark:text-zinc-600 dark:group-hover:text-red-400"
                            aria-hidden
                          />
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-xs text-slate-600 dark:text-zinc-300">
                          {ACCOUNT_TYPE_LABELS[customer.account_type]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-xs text-slate-600 dark:text-zinc-300" title={place(customer) ?? undefined}>
                          {place(customer) ?? <span className="text-slate-400 dark:text-zinc-600">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Contact customer={customer} />
                      </td>
                      <td className="px-3 py-2.5">
                        <SegmentChip segment={customer.segment} />
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-600 dark:text-zinc-300">
                        {date.format(new Date(customer.created_at))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {shown && shown.customers.length > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-between dark:border-white/10">
            <p className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">
              {(page * ADMIN_PAGE_SIZE + 1).toLocaleString("tr-TR")}–
              {Math.min((page + 1) * ADMIN_PAGE_SIZE, shown.total).toLocaleString("tr-TR")} /{" "}
              {shown.total.toLocaleString("tr-TR")} müşteri
            </p>
            <Pagination
              page={page}
              pageCount={Math.ceil(shown.total / ADMIN_PAGE_SIZE)}
              onChange={goTo}
              label="Müşteri sayfaları"
            />
          </div>
        )}
      </div>
    </>
  );
}
