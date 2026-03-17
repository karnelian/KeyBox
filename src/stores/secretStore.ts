import { create } from "zustand";
import * as commands from "@/lib/commands";
import type {
  SecretListItem,
  Secret,
  CreateSecretInput,
  UpdateSecretInput,
  GetSecretsFilter,
  SecretCounts,
} from "@/types";

interface SecretState {
  secrets: SecretListItem[];
  selectedSecret: Secret | null;
  filter: GetSecretsFilter;
  counts: SecretCounts;
  loading: boolean;
  error: string | null;
  fetchSecrets: () => Promise<void>;
  fetchCounts: () => Promise<void>;
  selectSecret: (id: string) => Promise<void>;
  clearSelection: () => void;
  setFilter: (filter: Partial<GetSecretsFilter>) => void;
  addSecret: (input: CreateSecretInput) => Promise<void>;
  editSecret: (input: UpdateSecretInput) => Promise<void>;
  removeSecret: (id: string) => Promise<void>;
  copySecret: (id: string, clearSeconds?: number) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
}

const emptyCounts: SecretCounts = { total: 0, byCategory: {}, byProject: {}, pinned: 0 };

export const useSecretStore = create<SecretState>((set, get) => ({
  secrets: [],
  selectedSecret: null,
  filter: {},
  counts: emptyCounts,
  loading: false,
  error: null,

  fetchSecrets: async () => {
    set({ loading: true, error: null });
    try {
      const secrets = await commands.getSecrets(get().filter);
      // 핀 고정된 항목을 맨 위로 정렬
      secrets.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return 0;
      });
      set({ secrets, loading: false });
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg, loading: false });
    }
  },

  fetchCounts: async () => {
    try {
      const counts = await commands.getSecretCounts();
      set({ counts });
    } catch {
      // 카운트 실패는 무시
    }
  },

  selectSecret: async (id: string) => {
    try {
      const secret = await commands.getSecret(id);
      set({ selectedSecret: secret });
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },

  clearSelection: () => set({ selectedSecret: null }),

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
    get().fetchSecrets();
  },

  addSecret: async (input) => {
    try {
      set({ error: null });
      await commands.createSecret(input);
      await get().fetchSecrets();
      await get().fetchCounts();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },

  editSecret: async (input) => {
    try {
      set({ error: null });
      const updated = await commands.updateSecret(input);
      set({ selectedSecret: updated });
      await get().fetchSecrets();
      await get().fetchCounts();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },

  removeSecret: async (id) => {
    try {
      await commands.deleteSecret(id);
      set({ selectedSecret: null });
      await get().fetchSecrets();
      await get().fetchCounts();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },

  copySecret: async (id, clearSeconds?: number) => {
    try {
      await commands.copyToClipboard(id, clearSeconds);
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },

  togglePin: async (id) => {
    try {
      const newPinned = await commands.togglePin(id);
      // 선택된 시크릿이면 상태 업데이트
      const selected = get().selectedSecret;
      if (selected?.id === id) {
        set({ selectedSecret: { ...selected, pinned: newPinned } });
      }
      await get().fetchSecrets();
      await get().fetchCounts();
    } catch (e: unknown) {
      const msg = typeof e === "string" ? e : (e as Error).message;
      set({ error: msg });
    }
  },
}));
