# KeyBox Planning Document

> **Summary**: API 키/토큰을 로컬에서 암호화하여 안전하게 관리하는 데스크톱 앱
>
> **Project**: KeyBox
> **Version**: 0.1.0
> **Author**: kang9
> **Date**: 2026-03-17
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 개발자가 다수의 API 키, 토큰 등 민감 정보를 스티키 메모나 평문 파일에 저장하여 보안 위험에 노출됨 |
| **Solution** | Tauri v2 + Rust 기반 데스크톱 앱으로 마스터 패스워드 + AES-256-GCM 암호화 로컬 저장소 제공 |
| **Function/UX Effect** | 앱 실행 → 마스터 패스워드 입력 → 카테고리별 키 관리, 원클릭 복사, 빠른 검색으로 즉시 활용 |
| **Core Value** | "기억하지 않아도 안전한" — 강력한 암호화와 직관적 UX로 개발자의 시크릿 관리 부담을 제거 |

---

## 1. Overview

### 1.1 Purpose

개발자가 보유한 다수의 API 키, 토큰, 시크릿을 안전하게 암호화 저장하고 편리하게 검색·복사·관리할 수 있는 데스크톱 앱을 제공한다.

### 1.2 Background

- 개발 프로젝트가 늘어남에 따라 관리해야 할 API 키, 토큰, 시크릿이 급증
- 스티키 메모, 메모장 등 평문 저장은 보안 사고 위험이 높음
- 기존 패스워드 매니저(1Password, Bitwarden)는 범용 도구라 개발자 워크플로우에 최적화되지 않음
- 개발자 전용 시크릿 매니저로 카테고리, 환경(dev/staging/prod), 프로젝트별 정리가 필요

### 1.3 Related Documents

- Design: `docs/02-design/features/keybox.design.md` (예정)

---

## 2. Scope

### 2.1 In Scope

- [x] 마스터 패스워드 기반 앱 잠금/해제
- [x] API 키/토큰/시크릿 CRUD (생성, 조회, 수정, 삭제)
- [x] AES-256-GCM 암호화 로컬 저장
- [x] 카테고리 및 태그 기반 분류
- [x] 빠른 검색 (이름, 서비스명, 태그)
- [x] 원클릭 클립보드 복사 (자동 만료)
- [x] 데이터 내보내기/가져오기 (암호화된 형태)

### 2.2 Out of Scope

- 클라우드 동기화 (v1.0에서 제외, 향후 고려)
- 팀 공유 기능
- 브라우저 확장 프로그램
- 모바일 앱

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 마스터 패스워드 설정 및 검증 (Argon2 키 파생) | High | Pending |
| FR-02 | 시크릿 항목 CRUD (이름, 값, 서비스, 카테고리, 태그, 메모) | High | Pending |
| FR-03 | AES-256-GCM 암호화/복호화 (Rust 백엔드) | High | Pending |
| FR-04 | 카테고리/태그 관리 | Medium | Pending |
| FR-05 | 전문 검색 (이름, 서비스명, 태그 기반 필터링) | High | Pending |
| FR-06 | 클립보드 복사 + 자동 클리어 (30초) | High | Pending |
| FR-07 | 자동 잠금 (비활성 시간 초과) | Medium | Pending |
| FR-08 | 암호화된 JSON 내보내기/가져오기 | Low | Pending |
| FR-09 | 다크/라이트 테마 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 앱 시작 ~ 잠금해제 < 2초 | 수동 측정 |
| Performance | 검색 결과 표시 < 100ms | 프로파일링 |
| Security | AES-256-GCM + Argon2id 키 파생 | 코드 리뷰 |
| Security | 메모리 내 평문 키 최소화, 사용 후 즉시 제거 | 코드 리뷰 |
| Security | 클립보드 자동 클리어 (30초) | 기능 테스트 |
| Usability | 3클릭 이내 키 복사 가능 | UX 테스트 |
| Size | 설치 파일 < 20MB | 빌드 결과 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR (High) 기능 구현 완료
- [ ] 암호화/복호화 정상 동작 검증
- [ ] Windows/macOS 빌드 및 실행 확인
- [ ] 기본 UI/UX 테스트 완료

### 4.2 Quality Criteria

- [ ] Rust 백엔드 유닛 테스트 통과
- [ ] React 컴포넌트 테스트 통과 (Vitest)
- [ ] 빌드 성공 (Windows, macOS)
- [ ] 클립보드 자동 클리어 동작 확인

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 암호화 구현 오류로 데이터 유출 | High | Low | 검증된 라이브러리(ring/aes-gcm) 사용, 자체 구현 금지 |
| 마스터 패스워드 분실 시 데이터 복구 불가 | High | Medium | 초기 설정 시 경고 표시, 내보내기 기능 권장 |
| Tauri v2 크로스 플랫폼 호환성 이슈 | Medium | Low | 주요 OS에서 조기 테스트 |
| SQLite 파일 손상 | Medium | Low | WAL 모드 사용, 백업 기능 제공 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Desktop Framework | Electron / Tauri | **Tauri v2** | Rust 백엔드로 암호화 성능·안전성 우수, 번들 ~5MB |
| Frontend | React / Vue / Svelte | **React 19** | Tauri 공식 지원, 넓은 생태계 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS v4** | 빠른 UI 구축, 다크모드 내장 지원 |
| State Management | Context / Zustand / Jotai | **Zustand** | 경량, 보일러플레이트 최소 |
| Encryption | Web Crypto / Rust lib | **Rust (aes-gcm + argon2)** | 네이티브 성능, 메모리 안전성 |
| Local DB | JSON file / SQLite | **SQLite (rusqlite)** | 구조화 쿼리, 검색 성능 |
| Testing | Jest / Vitest | **Vitest** | Vite 기반 빠른 테스트 |
| Build | Vite | **Vite** | Tauri 기본 번들러 |

### 6.3 Architecture Overview

```
┌──────────────────────────────────────────┐
│              Tauri v2 App                │
├──────────────────────────────────────────┤
│  Frontend (React + TypeScript + Vite)    │
│  ┌─────────┐ ┌──────┐ ┌──────────────┐  │
│  │  Pages  │ │Store │ │  Components  │  │
│  │ (Views) │ │(Zust)│ │  (Tailwind)  │  │
│  └────┬────┘ └──┬───┘ └──────────────┘  │
│       │         │   Tauri IPC (invoke)   │
├───────┴─────────┴────────────────────────┤
│  Backend (Rust)                          │
│  ┌───────────┐ ┌──────────┐ ┌────────┐  │
│  │  Commands │ │  Crypto  │ │   DB   │  │
│  │ (Tauri)   │ │(aes-gcm) │ │(SQLite)│  │
│  └───────────┘ └──────────┘ └────────┘  │
│  ┌──────────────────────────────────┐    │
│  │  Key Derivation (argon2)         │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

Folder Structure:
```
KeyBox/
├── src/                    # React Frontend
│   ├── components/         # UI 컴포넌트
│   ├── pages/              # 페이지 뷰
│   ├── stores/             # Zustand 상태관리
│   ├── types/              # TypeScript 타입
│   └── lib/                # 유틸리티
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── main.rs         # Tauri 엔트리
│   │   ├── commands/       # IPC 커맨드
│   │   ├── crypto/         # 암호화 모듈
│   │   ├── db/             # SQLite 관리
│   │   └── models/         # 데이터 모델
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                   # PDCA 문서
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] ESLint configuration
- [ ] Prettier configuration
- [ ] TypeScript strict mode

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | camelCase (TS), snake_case (Rust) | High |
| **Folder structure** | missing | 위 아키텍처 참조 | High |
| **Import order** | missing | 외부 → 내부 → 타입 순서 | Medium |
| **Error handling** | missing | Rust: Result<T, E>, TS: try-catch + toast | Medium |
| **Tauri IPC** | missing | 커맨드 네이밍 규칙 (verb_noun) | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope |
|----------|---------|-------|
| (없음) | 로컬 앱이므로 환경변수 불필요 | - |

> 참고: 모든 설정은 앱 내부 config로 관리. 암호화 키는 마스터 패스워드에서 런타임 파생.

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design keybox`)
2. [ ] Tauri v2 프로젝트 초기화
3. [ ] Rust 암호화 모듈 구현
4. [ ] React UI 구현
5. [ ] 통합 테스트 및 빌드

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-17 | Initial draft | kang9 |
