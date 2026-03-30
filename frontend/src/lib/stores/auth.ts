import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userName: string | null;
  setAuth: (token: string, userName: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userName: null,
      setAuth: (token, userName) => set({ token, userName }),
      clearAuth: () => set({ token: null, userName: null }),
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: "auth-storage",
    }
  )
);
