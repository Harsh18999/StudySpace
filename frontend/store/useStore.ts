import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Space, Module, Resource } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

interface LMSState {
  activeSpace: Space | null;
  activeModule: Module | null;
  activeResource: Resource | null;
  setActiveSpace: (space: Space | null) => void;
  setActiveModule: (module: Module | null) => void;
  setActiveResource: (resource: Resource | null) => void;
}

interface UIState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  activeTab: "overview" | "transcript" | "discussion";
  activeRightTab: "resources" | "quiz" | "notes" | "flashcards";
  commandPaletteOpen: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  setRightPanelOpen: (v: boolean) => void;
  setActiveTab: (tab: "overview" | "transcript" | "discussion") => void;
  setActiveRightTab: (tab: "resources" | "quiz" | "notes" | "flashcards") => void;
  setCommandPaletteOpen: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-store",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

export const useLMSStore = create<LMSState>()((set) => ({
  activeSpace: null,
  activeModule: null,
  activeResource: null,
  setActiveSpace: (space) => set({ activeSpace: space }),
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveResource: (resource) => set({ activeResource: resource }),
}));

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  rightPanelOpen: true,
  activeTab: "overview",
  activeRightTab: "quiz",
  commandPaletteOpen: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
}));
