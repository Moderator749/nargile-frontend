import type { FocusEvent } from "react";

import type { FieldKey } from "@/components/auth/registrationDraft";

/**
 * What a sign-up field takes from the form: its error, when there is one to
 * show, and the blur that lets the form show it before the button is pressed.
 * Spread onto an `Input` or `Select`: `<Input {...bind("email")} … />`.
 */
export interface FieldBinding {
  error?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
}
export type Bind = (key: FieldKey) => FieldBinding;

/** For a field group used without the form's checks. */
export const UNBOUND: Bind = () => ({});

/** A radio group's error marker: what the form scrolls to, and its message's id. */
export function groupInvalid(error: string | undefined) {
  return error ? { "data-invalid": "", "aria-invalid": true } : {};
}
