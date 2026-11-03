import { create } from "zustand";

/**
 * Whether Ekip Kanalı's drawer is open: its button, the staff landing card and
 * the drawer itself all read and set it. Not persisted: a reload starts closed.
 */
export const useTeamChannel = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
