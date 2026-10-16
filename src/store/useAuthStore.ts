import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { clearToken, getToken, setToken } from "@/lib/auth";
import { useCartStore } from "@/store/useCartStore";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  /** Refresh the profile (e.g. Sultan Puan balance) without touching the token. */
  setUser: (user: User) => void;
  /** Pass `keepCart` when the session merely expired (same person, keep their cart). */
  logout: (options?: { keepCart?: boolean }) => void;
}

// The token's source of truth is src/lib/auth.ts (read by the API interceptor).
// This store mirrors it for React and persists only the user profile.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (token, user) => {
        setToken(token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: (options) => {
        clearToken();
        set({ token: null, user: null });
        // On an explicit logout, never leave the cart behind on a shared computer.
        if (!options?.keepCart) useCartStore.getState().clearCart();
      },
    }),
    {
      name: "nargile-auth",
      // window.localStorage throws on the server, which disables persistence there.
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ user: state.user }),
      // Rehydrated manually after mount (see StoreHydration) to avoid SSR mismatches.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        const token = getToken();
        // A profile without a token is stale (expired or cleared elsewhere).
        useAuthStore.setState((state) => ({
          token,
          user: token ? state.user : null,
        }));
      },
    },
  ),
);
