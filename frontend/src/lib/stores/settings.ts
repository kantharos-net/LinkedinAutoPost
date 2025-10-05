import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_API_BASE_URL } from "@/src/lib/utils/runtime";

export interface UserSettings {
  apiBaseUrl: string;
  apiToken: string;
  defaultModel: string;
  defaultTemperature: number;
  timezone: string;
  enableLiveLogs: boolean;
}

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  reset: () => void;
}

const defaultSettings: UserSettings = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  apiToken: process.env.NEXT_PUBLIC_API_TOKEN ?? "",
  defaultModel: "gpt-3.5-turbo",
  defaultTemperature: 0.7,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  enableLiveLogs: true
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial }
        })),
      reset: () => set({ settings: defaultSettings })
    }),
    {
      name: "lap-settings",
      version: 1
    }
  )
);

export function getAuthHeaders() {
  const token = useSettingsStore.getState().settings.apiToken;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
