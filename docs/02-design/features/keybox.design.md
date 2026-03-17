# KeyBox Design Document

> **Summary**: API 키/토큰을 AES-256-GCM으로 암호화하여 로컬 관리하는 Tauri v2 데스크톱 앱 상세 설계
>
> **Project**: KeyBox
> **Version**: 0.1.0
> **Author**: kang9
> **Date**: 2026-03-17
> **Status**: Draft
> **Planning Doc**: [keybox.plan.md](../../01-plan/features/keybox.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 마스터 패스워드 하나로 모든 시크릿을 보호하는 안전한 로컬 저장소
- 3클릭 이내 키 검색 → 복사 가능한 빠른 UX
- Rust 백엔드로 암호화 성능과 메모리 안전성 보장
- 경량 설치 파일 (~5MB)

### 1.2 Design Principles

- **Security First**: 시크릿 값은 항상 암호화 상태, 메모리 노출 최소화
- **Simplicity**: 최소 기능으로 최대 효용, 과도한 추상화 금지
- **Offline First**: 네트워크 의존 없이 완전한 로컬 동작
- **Developer UX**: 개발자 워크플로우에 최적화된 분류/검색/복사

---

## 2. Architecture

### 2.1 Component Diagram

```
┌────────────────────────────────────────────────────────┐
│                    Tauri v2 App                         │
├────────────────────────────────────────────────────────┤
│  Frontend (React 19 + TypeScript + Vite)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pages                                           │  │
│  │  ├── LockScreen    (마스터 패스워드 입력)          │  │
│  │  ├── SetupScreen   (최초 설정)                    │  │
│  │  └── MainScreen    (3-pane 시크릿 관리)           │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  Components                                      │  │
│  │  ├── Sidebar       (카테고리 네비게이션)           │  │
│  │  ├── SecretList    (시크릿 목록 + 검색)           │  │
│  │  ├── SecretDetail  (상세 보기/편집)               │  │
│  │  ├── SecretForm    (생성/수정 폼)                 │  │
│  │  └── SearchBar     (전역 검색)                    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  Stores (Zustand)                                │  │
│  │  ├── useAuthStore      (잠금 상태)                │  │
│  │  ├── useSecretStore    (시크릿 목록/필터)          │  │
│  │  └── useCategoryStore  (카테고리/태그)             │  │
│  └──────────────────────────────────────────────────┘  │
│                    │ Tauri IPC (invoke)                 │
├────────────────────┴───────────────────────────────────┤
│  Backend (Rust)                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Commands (Tauri IPC)                            │  │
│  │  ├── auth_commands     (setup, unlock, lock)      │  │
│  │  ├── secret_commands   (CRUD, search, copy)       │  │
│  │  ├── category_commands (CRUD)                     │  │
│  │  └── export_commands   (import/export)            │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  Crypto Module                                   │  │
│  │  ├── argon2id      (패스워드 → 마스터 키 파생)     │  │
│  │  ├── hkdf          (마스터 키 → 검증키/암호화키)    │  │
│  │  └── aes_gcm       (시크릿 값 암호화/복호화)       │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  DB Module (rusqlite)                            │  │
│  │  ├── migrations    (스키마 마이그레이션)            │  │
│  │  ├── queries       (CRUD, 검색)                   │  │
│  │  └── connection    (연결 관리)                     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### 최초 설정 플로우
```
사용자 → SetupScreen → 마스터 패스워드 입력 (2회)
  → [Rust] Argon2id(password, salt) → master_key
  → HKDF(master_key, "verify") → verify_hash (DB 저장)
  → HKDF(master_key, "encrypt") → encryption_key (메모리 보관)
  → DB 초기화 → MainScreen 이동
```

#### 잠금 해제 플로우
```
사용자 → LockScreen → 패스워드 입력
  → [Rust] Argon2id(password, stored_salt) → master_key
  → HKDF(master_key, "verify") → verify_hash
  → verify_hash == stored_hash? → 성공: encryption_key 파생 → MainScreen
                                → 실패: 에러 메시지 표시
```

#### 시크릿 생성 플로우
```
사용자 → SecretForm 입력 → [Rust] encrypt(value, encryption_key)
  → AES-256-GCM(plaintext, key, nonce) → ciphertext + tag
  → DB INSERT (name, service, category, tags: 평문 / value: 암호화)
  → 목록 갱신
```

#### 시크릿 복사 플로우
```
사용자 → SecretList에서 복사 버튼 클릭
  → [Rust] decrypt(ciphertext, encryption_key)
  → 클립보드에 복사
  → 30초 타이머 시작 → 자동 클리어
  → Toast: "복사됨 (30초 후 클리어)"
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Frontend Pages | Zustand Stores | 상태 읽기/쓰기 |
| Zustand Stores | Tauri IPC | Rust 백엔드 호출 |
| Tauri Commands | Crypto Module | 암호화/복호화 |
| Tauri Commands | DB Module | 데이터 영속성 |
| Crypto Module | argon2, aes-gcm, hkdf crates | 암호화 알고리즘 |
| DB Module | rusqlite crate | SQLite 접근 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// Frontend Types (src/types/)

interface Secret {
  id: string;              // UUID
  name: string;            // 시크릿 이름 (e.g., "OpenAI API Key")
  secretValue: string;     // 복호화된 값 (프론트에서만 사용, 저장 시 암호화)
  service: string;         // 서비스명 (e.g., "OpenAI", "AWS")
  categoryId: string;      // 카테고리 FK
  tags: string[];          // 태그 목록
  notes: string;           // 메모
  environment: string;     // "dev" | "staging" | "prod" | ""
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

interface Category {
  id: string;              // UUID
  name: string;            // 카테고리명 (e.g., "AI Services", "Cloud")
  icon: string;            // 아이콘 이름
  order: number;           // 정렬 순서
}

interface AppConfig {
  isSetup: boolean;        // 최초 설정 완료 여부
  autoLockMinutes: number; // 자동 잠금 시간 (기본 5분)
  clipboardClearSeconds: number; // 클립보드 자동 클리어 (기본 30초)
  theme: "light" | "dark" | "system";
}
```

### 3.2 Entity Relationships

```
[Category] 1 ──── N [Secret]
```

### 3.3 Database Schema (SQLite)

```sql
-- 앱 설정 (마스터 패스워드 검증 정보 포함)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- 저장 항목: salt, verify_hash, auto_lock_minutes, clipboard_clear_seconds, theme

-- 카테고리
CREATE TABLE categories (
  id TEXT PRIMARY KEY,        -- UUID
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 시크릿
CREATE TABLE secrets (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  encrypted_value BLOB NOT NULL,    -- AES-256-GCM 암호화된 값
  nonce BLOB NOT NULL,              -- 12-byte GCM nonce
  service TEXT DEFAULT '',
  category_id TEXT,
  tags TEXT DEFAULT '[]',           -- JSON array string
  notes TEXT DEFAULT '',
  environment TEXT DEFAULT '',      -- dev/staging/prod/empty
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 검색 성능용 인덱스
CREATE INDEX idx_secrets_name ON secrets(name);
CREATE INDEX idx_secrets_service ON secrets(service);
CREATE INDEX idx_secrets_category ON secrets(category_id);
CREATE INDEX idx_secrets_environment ON secrets(environment);
```

---

## 4. Tauri IPC Command Specification

### 4.1 Command List

| Module | Command | Description | Input | Output |
|--------|---------|-------------|-------|--------|
| auth | `check_setup` | 최초 설정 여부 확인 | - | `bool` |
| auth | `setup_master_password` | 마스터 패스워드 설정 | `password: String` | `Result<()>` |
| auth | `unlock` | 잠금 해제 | `password: String` | `Result<()>` |
| auth | `lock` | 잠금 | - | `()` |
| secret | `create_secret` | 시크릿 생성 | `CreateSecretInput` | `Result<Secret>` |
| secret | `get_secrets` | 목록 조회 (필터) | `GetSecretsFilter` | `Vec<SecretListItem>` |
| secret | `get_secret` | 상세 조회 (복호화) | `id: String` | `Result<Secret>` |
| secret | `update_secret` | 시크릿 수정 | `UpdateSecretInput` | `Result<Secret>` |
| secret | `delete_secret` | 시크릿 삭제 | `id: String` | `Result<()>` |
| secret | `copy_to_clipboard` | 복호화 후 클립보드 복사 | `id: String` | `Result<()>` |
| secret | `search_secrets` | 전문 검색 | `query: String` | `Vec<SecretListItem>` |
| category | `get_categories` | 카테고리 목록 | - | `Vec<Category>` |
| category | `create_category` | 카테고리 생성 | `CreateCategoryInput` | `Result<Category>` |
| category | `update_category` | 카테고리 수정 | `UpdateCategoryInput` | `Result<Category>` |
| category | `delete_category` | 카테고리 삭제 | `id: String` | `Result<()>` |
| export | `export_data` | 암호화 내보내기 | `path: String` | `Result<()>` |
| export | `import_data` | 가져오기 | `path: String, password: String` | `Result<ImportResult>` |

### 4.2 Key Input/Output Types (Rust)

```rust
#[derive(Serialize, Deserialize)]
pub struct CreateSecretInput {
    pub name: String,
    pub secret_value: String,  // 평문 → Rust에서 암호화
    pub service: String,
    pub category_id: Option<String>,
    pub tags: Vec<String>,
    pub notes: String,
    pub environment: String,
}

#[derive(Serialize, Deserialize)]
pub struct SecretListItem {
    pub id: String,
    pub name: String,
    pub service: String,
    pub category_id: Option<String>,
    pub tags: Vec<String>,
    pub environment: String,
    pub updated_at: String,
    // Note: secret_value는 목록에 포함하지 않음 (보안)
}

#[derive(Serialize, Deserialize)]
pub struct GetSecretsFilter {
    pub category_id: Option<String>,
    pub environment: Option<String>,
    pub tag: Option<String>,
}
```

---

## 5. UI/UX Design

### 5.1 Screen Layout

#### LockScreen (잠금 화면)
```
┌─────────────────────────────────┐
│                                 │
│          🔐 KeyBox              │
│                                 │
│    ┌───────────────────────┐    │
│    │  마스터 패스워드 입력    │    │
│    └───────────────────────┘    │
│         [ 잠금 해제 ]           │
│                                 │
└─────────────────────────────────┘
```

#### MainScreen (메인 화면 — 3-pane)
```
┌─────────────────────────────────────────────────────┐
│  🔍 검색...                              [+] [⚙] [🔒] │
├────────┬────────────────────┬───────────────────────┤
│ 📂 All │  Name         Svc  │ Name: OpenAI API Key  │
│ 🤖 AI  │ ────────────────── │ Service: OpenAI       │
│ ☁ Cloud│ > OpenAI Key  AI   │ Category: AI Services │
│ 🔧 Dev │   AWS Token  Cloud │ Env: prod             │
│ 📦 DB  │   GitHub PAT Dev   │ Tags: #gpt #api       │
│        │   Supabase   DB    │                       │
│        │                    │ Value: ••••••••••••    │
│        │                    │ [👁 보기] [📋 복사]     │
│ ───────│                    │                       │
│ [+ 카테]│                    │ Notes: GPT-4 용       │
│        │                    │ Updated: 2026-03-17   │
├────────┴────────────────────┴───────────────────────┤
│  시크릿 12개 · 마지막 접근: 방금 전                      │
└─────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
앱 시작 ──→ [최초?] ──Yes──→ SetupScreen ──→ 패스워드 설정 ──→ MainScreen
              │No
              ▼
         LockScreen ──→ 패스워드 입력 ──→ MainScreen
                                            │
              ┌─────────────────────────────┤
              ▼                             ▼
         검색/필터 ──→ 시크릿 선택      [+] 새 시크릿
              │                             │
              ▼                             ▼
         상세 보기 ──→ [복사] [편집] [삭제]  SecretForm ──→ 저장
              │
              ▼
         [자동잠금] or [🔒 수동잠금] ──→ LockScreen
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `LockScreen` | `src/pages/LockScreen.tsx` | 마스터 패스워드 입력, 잠금 해제 |
| `SetupScreen` | `src/pages/SetupScreen.tsx` | 최초 마스터 패스워드 설정 |
| `MainScreen` | `src/pages/MainScreen.tsx` | 3-pane 레이아웃 컨테이너 |
| `SearchBar` | `src/components/SearchBar.tsx` | 전역 검색 입력 |
| `Sidebar` | `src/components/Sidebar.tsx` | 카테고리 네비게이션 |
| `SecretList` | `src/components/SecretList.tsx` | 시크릿 목록 (필터 적용) |
| `SecretListItem` | `src/components/SecretListItem.tsx` | 목록 아이템 행 |
| `SecretDetail` | `src/components/SecretDetail.tsx` | 시크릿 상세 보기 |
| `SecretForm` | `src/components/SecretForm.tsx` | 생성/수정 폼 |
| `CategoryForm` | `src/components/CategoryForm.tsx` | 카테고리 생성/수정 |
| `SettingsModal` | `src/components/SettingsModal.tsx` | 설정 (자동잠금, 테마 등) |
| `Toast` | `src/components/Toast.tsx` | 알림 토스트 |

---

## 6. Error Handling

### 6.1 Rust Backend Errors

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("마스터 패스워드가 올바르지 않습니다")]
    InvalidPassword,

    #[error("앱이 잠겨 있습니다. 먼저 잠금을 해제하세요")]
    AppLocked,

    #[error("시크릿을 찾을 수 없습니다: {0}")]
    SecretNotFound(String),

    #[error("카테고리를 찾을 수 없습니다: {0}")]
    CategoryNotFound(String),

    #[error("이미 존재하는 카테고리입니다: {0}")]
    CategoryDuplicate(String),

    #[error("암호화 오류: {0}")]
    CryptoError(String),

    #[error("데이터베이스 오류: {0}")]
    DatabaseError(String),

    #[error("내보내기/가져오기 오류: {0}")]
    ExportError(String),
}

// Tauri 직렬화를 위한 구현
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_str(self.to_string().as_str())
    }
}
```

### 6.2 Frontend Error Handling

| 에러 유형 | 처리 방식 |
|----------|----------|
| `InvalidPassword` | LockScreen에 "패스워드가 틀렸습니다" 메시지 |
| `AppLocked` | 자동으로 LockScreen 리다이렉트 |
| `SecretNotFound` | Toast: "시크릿을 찾을 수 없습니다" |
| `CryptoError` | Toast: "암호화 오류 발생" + 재시도 안내 |
| `DatabaseError` | Toast: "저장 오류" + 앱 재시작 안내 |

---

## 7. Security Considerations

### 7.1 Encryption Architecture

```
마스터 패스워드 (사용자 입력)
    │
    ▼
Argon2id(password, salt, t=3, m=64MB, p=4)
    │
    ▼
master_key (32 bytes)
    │
    ├──→ HKDF-SHA256(master_key, info="keybox-verify")  → verify_hash (DB 저장)
    │
    └──→ HKDF-SHA256(master_key, info="keybox-encrypt") → encryption_key (메모리만)
                                                              │
                                                    AES-256-GCM encrypt/decrypt
                                                    (각 시크릿별 랜덤 12-byte nonce)
```

### 7.2 Security Checklist

- [x] 시크릿 값은 항상 AES-256-GCM 암호화 저장
- [x] 마스터 패스워드 원문은 어디에도 저장하지 않음
- [x] Argon2id 파라미터: t=3, m=64MB, p=4 (OWASP 권장)
- [x] 각 시크릿에 고유 12-byte 랜덤 nonce 사용
- [x] 클립보드 자동 클리어 (30초)
- [x] 비활성 시 자동 잠금 (encryption_key 메모리에서 제거)
- [x] 시크릿 값 UI 기본 마스킹 (••••)
- [x] Rust 메모리 안전성으로 버퍼 오버플로우 방지
- [ ] 파일 시스템 권한 제한 (DB 파일 600)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test (Rust) | Crypto, DB 쿼리 | `cargo test` |
| Unit Test (TS) | Zustand stores, 유틸리티 | Vitest |
| Component Test | React 컴포넌트 렌더링 | Vitest + React Testing Library |
| Integration Test | IPC 커맨드 e2e | Tauri test utilities |

### 8.2 Test Cases (Key)

- [x] 마스터 패스워드 설정 → 잠금 해제 → 동일 패스워드 성공
- [x] 잘못된 패스워드 → 잠금 해제 실패 에러
- [x] 시크릿 생성 → 암호화 저장 → 복호화 조회 → 값 일치
- [x] 시크릿 검색 → 이름/서비스/태그 필터링 정확성
- [x] 클립보드 복사 → 30초 후 클리어 확인
- [x] 자동 잠금 → 비활성 시간 초과 시 LockScreen 전환
- [x] 카테고리 삭제 → 연결된 시크릿의 category_id NULL 처리
- [x] 내보내기 → 가져오기 → 데이터 완전 복구 확인

---

## 9. Clean Architecture

### 9.1 Layer Structure (Tauri 맞춤)

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | React 컴포넌트, 페이지 | `src/pages/`, `src/components/` |
| **Application** | Zustand 스토어, Tauri IPC 호출 래퍼 | `src/stores/`, `src/lib/commands.ts` |
| **Domain** | TypeScript 타입, 검증 로직 | `src/types/` |
| **Infrastructure** | Tauri invoke 바인딩 | `src/lib/tauri.ts` |
| **Backend** | Rust 커맨드, 암호화, DB | `src-tauri/src/` |

### 9.2 Dependency Rules

```
Presentation ──→ Application (stores) ──→ Infrastructure (tauri invoke)
      │                  │
      └──→ Domain ◀──────┘
           (types)

Backend (Rust): commands ──→ crypto ──→ (aes-gcm, argon2 crates)
                   │
                   └──→ db ──→ (rusqlite crate)
```

---

## 10. Coding Convention

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| React Components | PascalCase | `SecretList`, `LockScreen` |
| TS Functions | camelCase | `getSecrets()`, `handleCopy()` |
| TS Types/Interfaces | PascalCase | `Secret`, `AppConfig` |
| TS Files (component) | PascalCase.tsx | `SecretList.tsx` |
| TS Files (utility) | camelCase.ts | `commands.ts` |
| Zustand Stores | use___Store | `useSecretStore` |
| Rust Functions | snake_case | `create_secret()`, `encrypt_value()` |
| Rust Structs | PascalCase | `CreateSecretInput` |
| Rust Files | snake_case.rs | `auth_commands.rs` |
| Tauri Commands | snake_case | `#[tauri::command] fn copy_to_clipboard()` |
| CSS Classes | Tailwind utility | `className="flex items-center"` |

### 10.2 Import Order (TypeScript)

```typescript
// 1. React / 외부 라이브러리
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// 2. 내부 모듈 (stores, lib)
import { useSecretStore } from "@/stores/secretStore";
import { commands } from "@/lib/commands";

// 3. 컴포넌트
import { SearchBar } from "@/components/SearchBar";

// 4. 타입
import type { Secret } from "@/types";
```

---

## 11. Implementation Guide

### 11.1 File Structure

```
KeyBox/
├── src/                          # React Frontend
│   ├── pages/
│   │   ├── LockScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   └── MainScreen.tsx
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SecretList.tsx
│   │   ├── SecretListItem.tsx
│   │   ├── SecretDetail.tsx
│   │   ├── SecretForm.tsx
│   │   ├── CategoryForm.tsx
│   │   ├── SettingsModal.tsx
│   │   └── Toast.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── secretStore.ts
│   │   └── categoryStore.ts
│   ├── lib/
│   │   ├── commands.ts           # Tauri IPC 래퍼
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                 # Tailwind 진입점
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Tauri 엔트리 + 커맨드 등록
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── auth.rs           # 마스터 패스워드 설정/검증
│   │   │   ├── secret.rs         # 시크릿 CRUD + 검색 + 복사
│   │   │   ├── category.rs       # 카테고리 CRUD
│   │   │   └── export.rs         # 내보내기/가져오기
│   │   ├── crypto/
│   │   │   ├── mod.rs
│   │   │   ├── argon2.rs         # 키 파생
│   │   │   ├── aes_gcm.rs        # 암호화/복호화
│   │   │   └── hkdf.rs           # 키 분리
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs     # SQLite 연결
│   │   │   ├── migrations.rs     # 스키마 생성
│   │   │   └── queries.rs        # SQL 쿼리
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── secret.rs
│   │   │   └── category.rs
│   │   ├── state.rs              # AppState (encryption_key 보관)
│   │   └── error.rs              # AppError 정의
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── docs/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── index.html
```

### 11.2 Implementation Order

1. [x] **Phase 1: 프로젝트 초기화**
   - Tauri v2 + React + TypeScript 프로젝트 생성
   - Tailwind CSS v4 설정
   - Zustand 설치
   - Rust dependencies (Cargo.toml)

2. [ ] **Phase 2: Rust 백엔드 코어**
   - `crypto/` 모듈 (argon2, aes_gcm, hkdf)
   - `db/` 모듈 (connection, migrations, queries)
   - `models/` 정의
   - `error.rs` 에러 타입
   - `state.rs` AppState

3. [ ] **Phase 3: Tauri IPC 커맨드**
   - `auth` 커맨드 (setup, unlock, lock)
   - `secret` 커맨드 (CRUD, search, copy)
   - `category` 커맨드 (CRUD)
   - 커맨드 등록 (main.rs)

4. [ ] **Phase 4: Frontend 기반**
   - TypeScript 타입 정의
   - Tauri IPC 래퍼 (`commands.ts`)
   - Zustand 스토어 3개

5. [ ] **Phase 5: UI 구현**
   - LockScreen / SetupScreen
   - MainScreen (3-pane layout)
   - SearchBar, Sidebar
   - SecretList, SecretDetail, SecretForm
   - CategoryForm, SettingsModal

6. [ ] **Phase 6: 부가 기능**
   - 클립보드 자동 클리어
   - 자동 잠금 타이머
   - 다크/라이트 테마
   - 내보내기/가져오기

7. [ ] **Phase 7: 테스트 & 빌드**
   - Rust 유닛 테스트
   - React 컴포넌트 테스트
   - Windows/macOS 빌드 확인

### 11.3 Rust Cargo Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1", features = ["v4"] }
argon2 = "0.5"
aes-gcm = "0.10"
hkdf = "0.12"
sha2 = "0.10"
rand = "0.8"
thiserror = "1"
chrono = "0.4"
arboard = "3"          # 크로스 플랫폼 클립보드
tokio = { version = "1", features = ["time"] }
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-17 | Initial draft | kang9 |
