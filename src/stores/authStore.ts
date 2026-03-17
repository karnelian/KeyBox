import { create } from "zustand";
import * as commands from "@/lib/commands";

interface AuthState {
  isSetup: boolean | null; // null = 로딩 중
  isUnlocked: boolean;
  error: string | null;
  checkSetup: () => Promise<void>;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isSetup: null,
  isUnlocked: false,
  error: null,

  checkSetup: async () => {
    const isSetup = await commands.checkSetup();
    set({ isSetup });
  },

  setup: async (password: string) => {
    try {
      set({ error: null });
      await commands.setupMasterPassword(password);
      set({ isSetup: true, isUnlocked: true });
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message ?? "설정에 실패했습니다";
      set({ error: msg });
    }
  },

  unlock: async (password: string) => {
    try {
      set({ error: null });
      await commands.unlock(password);
      set({ isUnlocked: true });
    } catch (e: unknown) {
      // Tauri는 에러를 문자열로 반환할 수 있음
      const msg = typeof e === "string" ? e : (e as Error).message ?? "잠금 해제에 실패했습니다";
      set({ error: msg });
    }
  },

  lock: async () => {
    await commands.lock();
    set({ isUnlocked: false });
  },

  clearError: () => set({ error: null }),
}));
