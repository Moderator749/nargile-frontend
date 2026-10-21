import { create } from "zustand";

/**
 * The category drawer (the column's list, below `lg`): opened from the menu
 * bar's "KATEGORİLER" and from the header's menu button on a phone, drawn
 * once by TopNav.
 */
export const useCategoryDrawer = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
