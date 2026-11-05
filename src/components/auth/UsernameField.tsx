"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { RegistrationCopy } from "@/components/auth/registrationCopy";
import { Input } from "@/components/ui/Input";
import { cleanUsername, trimUsername } from "@/lib/username";

/**
 * The username, cleaned as it is typed (lib/username): a space becomes "_",
 * "ş" becomes "s", anything else the server would refuse is left out — and
 * the field says so under itself while they are typing, instead of the form
 * turning the name down at the end. Leaving the field trims what a username
 * cannot start or end with.
 *
 * Changing the text under the cursor would send the cursor to the end; it is
 * put back where they were typing, after React has written the new value.
 */
export function UsernameField({
  copy,
  value,
  error,
  onChange,
  onLeave,
}: {
  copy: RegistrationCopy;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  /** With the trimmed value, once they leave the field. */
  onLeave: (value: string) => void;
}) {
  // What has had to change since they came into the field; a space turned
  // into "_" is still worth saying after the next letter was a plain one.
  const [notice, setNotice] = useState<{ spaces: boolean } | null>(null);
  const caret = useRef<{ input: HTMLInputElement; at: number } | null>(null);

  useLayoutEffect(() => {
    const pending = caret.current;
    if (!pending) return;
    caret.current = null;
    pending.input.setSelectionRange(pending.at, pending.at);
  });

  return (
    <Input
      label={copy.username}
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      maxLength={30}
      hint={copy.usernameHint}
      warning={notice ? (notice.spaces ? `${copy.usernameCleaned} ${copy.usernameSpaces}` : copy.usernameCleaned) : undefined}
      error={error}
      value={value}
      onChange={(e) => {
        const input = e.target;
        const typed = input.value;
        const cleaned = cleanUsername(typed);
        if (cleaned.spaces || cleaned.other) {
          setNotice((current) => ({ spaces: !!current?.spaces || cleaned.spaces }));
          caret.current = { input, at: cleanUsername(typed.slice(0, input.selectionStart ?? typed.length)).value.length };
        }
        onChange(cleaned.value);
      }}
      onBlur={() => {
        setNotice(null);
        onLeave(trimUsername(value));
      }}
    />
  );
}
