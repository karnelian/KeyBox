export interface Secret {
  id: string;
  name: string;
  secretValue: string;
  service: string;
  categoryId: string | null;
  projectId: string | null;
  pinned: boolean;
  tags: string[];
  notes: string;
  environment: "" | "dev" | "staging" | "prod";
  createdAt: string;
  updatedAt: string;
}

export type SecretListItem = Omit<Secret, "secretValue" | "notes">;

export interface CreateSecretInput {
  name: string;
  secretValue: string;
  service: string;
  categoryId: string | null;
  projectId: string | null;
  tags: string[];
  notes: string;
  environment: "" | "dev" | "staging" | "prod";
}

export interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface UpdateSecretInput extends Partial<CreateSecretInput> {
  id: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  icon?: string;
}

export interface ImportResult {
  categoriesImported: number;
  secretsImported: number;
}

export interface AppConfig {
  isSetup: boolean;
  autoLockMinutes: number;
  clipboardClearSeconds: number;
  theme: "light" | "dark" | "system";
}

export interface SecretCounts {
  total: number;
  byCategory: Record<string, number>;
  byProject: Record<string, number>;
  pinned: number;
}

export interface GetSecretsFilter {
  categoryId?: string;
  projectId?: string;
  environment?: string;
  tag?: string;
  query?: string;
  pinnedOnly?: boolean;
}
