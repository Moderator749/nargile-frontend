"use client";

import { createContext, useContext, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import type { ProblemField } from "@/lib/checkoutProblems";

/**
 * The fields a refused "Siparişi Tamamla" tap found wanting, for each field to
 * show in red under itself. Empty until the buyer has tapped once: nobody is
 * told off for a form they have not finished yet. It follows their typing from
 * then on, so a fixed field turns back at once.
 */
const CheckoutErrorsContext = createContext<Partial<Record<ProblemField, string>>>({});

export function CheckoutErrorsProvider({
  errors,
  children,
}: {
  errors: Partial<Record<ProblemField, string>>;
  children: ReactNode;
}) {
  return <CheckoutErrorsContext.Provider value={errors}>{children}</CheckoutErrorsContext.Provider>;
}

/** This field's message while it holds the order up, else undefined. */
export function useFieldError(field: ProblemField): string | undefined {
  return useContext(CheckoutErrorsContext)[field];
}

/**
 * Classes a checkout input adds to its own: red while `aria-invalid` is set.
 * Tailwind's variant keeps the field's markup as it was otherwise.
 */
export const INVALID_ARIA =
  "aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500/40 dark:aria-[invalid=true]:border-red-400/80";

/** The red line under a field, with the id its `aria-describedby` points at. */
export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

/** The attributes an input carries while it has an error. */
export function invalidProps(id: string, message: string | undefined) {
  return message ? { "aria-invalid": true as const, "aria-describedby": `${id}-error`, "data-invalid": "" } : {};
}
