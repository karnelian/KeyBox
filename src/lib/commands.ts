/**
 * Tauri IPC 래퍼
 *
 * Tauri 환경에서는 invoke()로 Rust 백엔드를 호출합니다.
 * 브라우저 단독 실행 시(npm run dev)에는 mock fallback을 사용합니다.
 */
import type {
  Secret,
  SecretListItem,
  CreateSecretInput,
  UpdateSecretInput,
  Category,
  UpdateCategoryInput,
  Project,
  GetSecretsFilter,
  SecretCounts,
  ImportResult,
} from "@/types";

// Tauri 환경 감지
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Tauri invoke (동적 import로 번들 최적화)
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke<T>(cmd, args);
  }
  // Mock fallback
  return mockInvoke<T>(cmd, args);
}

// --- Auth Commands ---

export async function checkSetup(): Promise<boolean> {
  return invoke<boolean>("check_setup");
}

export async function setupMasterPassword(password: string): Promise<void> {
  return invoke<void>("setup_master_password", { password });
}

export async function unlock(password: string): Promise<void> {
  return invoke<void>("unlock", { password });
}

export async function lock(): Promise<void> {
  return invoke<void>("lock");
}

// --- Settings Commands ---

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  return invoke<void>("save_settings", { settingsJson: JSON.stringify(settings) });
}

export async function loadSettings(): Promise<Record<string, unknown> | null> {
  const json = await invoke<string | null>("load_settings");
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

// --- Secret Commands ---

export async function createSecret(input: CreateSecretInput): Promise<Secret> {
  return invoke<Secret>("create_secret", { input });
}

export async function getSecrets(filter?: GetSecretsFilter): Promise<SecretListItem[]> {
  return invoke<SecretListItem[]>("get_secrets", { filter: filter ?? null });
}

export async function getSecret(id: string): Promise<Secret> {
  return invoke<Secret>("get_secret", { id });
}

export async function updateSecret(input: UpdateSecretInput): Promise<Secret> {
  return invoke<Secret>("update_secret", { input });
}

export async function deleteSecret(id: string): Promise<void> {
  return invoke<void>("delete_secret", { id });
}

export async function copyToClipboard(id: string, clearSeconds?: number): Promise<void> {
  return invoke<void>("copy_to_clipboard", { id, clearSeconds: clearSeconds ?? 30 });
}

export async function searchSecrets(query: string): Promise<SecretListItem[]> {
  return invoke<SecretListItem[]>("search_secrets", { query });
}

export async function togglePin(id: string): Promise<boolean> {
  return invoke<boolean>("toggle_pin", { id });
}

export async function getSecretCounts(): Promise<SecretCounts> {
  return invoke<SecretCounts>("get_secret_counts");
}

export interface EnvImportResult {
  imported: number;
  skipped: number;
}

export async function importEnvFile(path: string, projectId?: string): Promise<EnvImportResult> {
  return invoke<EnvImportResult>("import_env_file", { path, projectId: projectId ?? null });
}

// --- Category Commands ---

export async function getCategories(): Promise<Category[]> {
  return invoke<Category[]>("get_categories");
}

export async function createCategory(name: string, icon: string): Promise<Category> {
  return invoke<Category>("create_category", { name, icon });
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  return invoke<Category>("update_category", { input });
}

export async function deleteCategory(id: string): Promise<void> {
  return invoke<void>("delete_category", { id });
}

// --- Project Commands ---

export async function getProjects(): Promise<Project[]> {
  return invoke<Project[]>("get_projects");
}

export async function createProject(name: string, color: string): Promise<Project> {
  return invoke<Project>("create_project", { name, color });
}

export async function deleteProject(id: string): Promise<void> {
  return invoke<void>("delete_project", { id });
}

// --- Export / Import Commands ---

export async function exportData(path: string): Promise<void> {
  return invoke<void>("export_data", { path });
}

export async function importData(path: string): Promise<ImportResult> {
  return invoke<ImportResult>("import_data", { path });
}

// ============================================================
// Mock fallback (브라우저 단독 실행용)
// ============================================================
let mockSetup = false;
let mockUnlocked = false;
let mockPassword = "";
const mockSecrets: Secret[] = [];
const mockProjects: Project[] = [
  { id: "proj-1", name: "내 SaaS", color: "#6366f1", order: 0 },
  { id: "proj-2", name: "회사 프로젝트", color: "#22c55e", order: 1 },
];
const mockCategories: Category[] = [
  { id: "cat-ai", name: "AI Services", icon: "bot", order: 0 },
  { id: "cat-cloud", name: "Cloud", icon: "cloud", order: 1 },
  { id: "cat-dev", name: "Dev Tools", icon: "wrench", order: 2 },
  { id: "cat-db", name: "Database", icon: "database", order: 3 },
];

function generateId(): string {
  return crypto.randomUUID();
}
function now(): string {
  return new Date().toISOString();
}

async function mockInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case "check_setup":
      return mockSetup as T;

    case "setup_master_password": {
      const pw = args?.password as string;
      if (pw.length < 8) throw new Error("패스워드는 8자 이상이어야 합니다");
      mockPassword = pw;
      mockSetup = true;
      mockUnlocked = true;
      return undefined as T;
    }

    case "unlock": {
      const pw = args?.password as string;
      if (pw !== mockPassword) throw new Error("마스터 패스워드가 올바르지 않습니다");
      mockUnlocked = true;
      return undefined as T;
    }

    case "lock":
      mockUnlocked = false;
      return undefined as T;

    case "save_settings":
      localStorage.setItem("keybox-settings", args?.settingsJson as string);
      return undefined as T;

    case "load_settings":
      return (localStorage.getItem("keybox-settings") ?? null) as T;

    case "create_secret": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const input = args?.input as CreateSecretInput;
      const secret: Secret = { id: generateId(), ...input, pinned: false, createdAt: now(), updatedAt: now() };
      mockSecrets.push(secret);
      return secret as T;
    }

    case "get_secrets": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const filter = (args?.filter as GetSecretsFilter) ?? {};
      let filtered = [...mockSecrets];
      if (filter.categoryId)
        filtered = filtered.filter((s) => s.categoryId === filter.categoryId);
      if (filter.projectId)
        filtered = filtered.filter((s) => s.projectId === filter.projectId);
      if (filter.pinnedOnly)
        filtered = filtered.filter((s) => s.pinned);
      if (filter.environment)
        filtered = filtered.filter((s) => s.environment === filter.environment);
      if (filter.query) {
        const q = filter.query.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.service.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return filtered.map(({ secretValue: _, notes: _n, ...item }) => item) as T;
    }

    case "get_secret": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const s = mockSecrets.find((s) => s.id === (args?.id as string));
      if (!s) throw new Error("시크릿을 찾을 수 없습니다");
      return s as T;
    }

    case "update_secret": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const upd = args?.input as { id: string } & Partial<CreateSecretInput>;
      const idx = mockSecrets.findIndex((s) => s.id === upd.id);
      if (idx === -1) throw new Error("시크릿을 찾을 수 없습니다");
      const updated = { ...mockSecrets[idx]!, ...upd, updatedAt: now() };
      mockSecrets[idx] = updated;
      return updated as T;
    }

    case "delete_secret": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const di = mockSecrets.findIndex((s) => s.id === (args?.id as string));
      if (di === -1) throw new Error("시크릿을 찾을 수 없습니다");
      mockSecrets.splice(di, 1);
      return undefined as T;
    }

    case "copy_to_clipboard": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const cs = mockSecrets.find((s) => s.id === (args?.id as string));
      if (!cs) throw new Error("시크릿을 찾을 수 없습니다");
      await navigator.clipboard.writeText(cs.secretValue);
      return undefined as T;
    }

    case "get_categories":
      return [...mockCategories].sort((a, b) => a.order - b.order) as T;

    case "create_category": {
      const name = args?.name as string;
      const icon = args?.icon as string;
      if (mockCategories.some((c) => c.name === name))
        throw new Error("이미 존재하는 카테고리입니다");
      const cat: Category = { id: generateId(), name, icon, order: mockCategories.length };
      mockCategories.push(cat);
      return cat as T;
    }

    case "update_category": {
      const upd = args?.input as UpdateCategoryInput;
      const ci = mockCategories.findIndex((c) => c.id === upd.id);
      if (ci === -1) throw new Error("카테고리를 찾을 수 없습니다");
      const updated = { ...mockCategories[ci]!, ...upd };
      mockCategories[ci] = updated;
      return updated as T;
    }

    case "delete_category": {
      const ci = mockCategories.findIndex((c) => c.id === (args?.id as string));
      if (ci === -1) throw new Error("카테고리를 찾을 수 없습니다");
      mockCategories.splice(ci, 1);
      mockSecrets.forEach((s) => {
        if (s.categoryId === (args?.id as string)) s.categoryId = null;
      });
      return undefined as T;
    }

    case "toggle_pin": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const ts = mockSecrets.find((s) => s.id === (args?.id as string));
      if (!ts) throw new Error("시크릿을 찾을 수 없습니다");
      ts.pinned = !ts.pinned;
      return ts.pinned as T;
    }

    case "get_secret_counts": {
      const byCategory: Record<string, number> = {};
      const byProject: Record<string, number> = {};
      let pinned = 0;
      for (const s of mockSecrets) {
        if (s.categoryId) byCategory[s.categoryId] = (byCategory[s.categoryId] ?? 0) + 1;
        if (s.projectId) byProject[s.projectId] = (byProject[s.projectId] ?? 0) + 1;
        if (s.pinned) pinned++;
      }
      return { total: mockSecrets.length, byCategory, byProject, pinned } as T;
    }

    case "get_projects":
      return [...mockProjects].sort((a, b) => a.order - b.order) as T;

    case "create_project": {
      const name = args?.name as string;
      const color = args?.color as string;
      if (mockProjects.some((p) => p.name === name))
        throw new Error("이미 존재하는 프로젝트입니다");
      const proj: Project = { id: generateId(), name, color, order: mockProjects.length };
      mockProjects.push(proj);
      return proj as T;
    }

    case "delete_project": {
      const pi = mockProjects.findIndex((p) => p.id === (args?.id as string));
      if (pi === -1) throw new Error("프로젝트를 찾을 수 없습니다");
      mockProjects.splice(pi, 1);
      mockSecrets.forEach((s) => {
        if (s.projectId === (args?.id as string)) s.projectId = null;
      });
      return undefined as T;
    }

    case "search_secrets": {
      if (!mockUnlocked) throw new Error("앱이 잠겨 있습니다");
      const q = (args?.query as string).toLowerCase();
      const results = mockSecrets.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.service.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
      return results.map(({ secretValue: _, notes: _n, ...item }) => item) as T;
    }

    case "import_env_file":
      // Mock: 브라우저에서는 파일 시스템 접근 불가
      return { imported: 0, skipped: 0 } as T;

    case "export_data":
      // Mock: 브라우저 환경에서는 파일 시스템 접근 불가 — no-op
      return undefined as T;

    case "import_data":
      // Mock: 브라우저 환경에서는 파일 시스템 접근 불가 — no-op
      return { categoriesImported: 0, secretsImported: 0 } as T;

    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
}
