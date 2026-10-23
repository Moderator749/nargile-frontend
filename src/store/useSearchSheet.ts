import { create } from "zustand";

/** The phone's search sheet: opened from the tab bar's "Ara", drawn once by StorefrontChrome. */
export const useSearchSheet = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
