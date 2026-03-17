# KeyBox v0.2.0 Planning Document

> **Summary**: v0.1.0 버그 수정 + 개발자 워크플로우 통합으로 "진짜 개발자 도구"로 도약
>
> **Project**: KeyBox
> **Version**: 0.2.0
> **Author**: kang9
> **Date**: 2026-03-17
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v0.1.0 설정값이 재시작 시 초기화되고, export가 평문 JSON으로 저장되어 보안 도구로서 신뢰를 훼손함. 또한 경쟁 도구(1Password, Bitwarden) 대비 개발자 특화 기능이 부족함 |
| **Solution** | 치명적 버그(설정 미영속화, export 평문)를 즉시 수정하고, 만료일 추적·SSH 키 타입 지원·.env 역내보내기 등 개발자 워크플로우에 특화된 기능을 추가 |
| **Function/UX Effect** | 설정이 재시작 후에도 유지되고, export 파일이 암호화됨. 시크릿에 만료일을 설정하면 만료 전 알림을 받고, SSH 공개키를 별도 필드로 관리하며, .env 파일로 역내보내기 가능 |
| **Core Value** | "개발자를 위해 만들어진 유일한 시크릿 매니저" — 범용 패스워드 매니저가 채우지 못하는 개발 워크플로우 빈틈을 정확히 공략 |

---

## 1. Overview

### 1.1 Purpose

v0.1.0에서 발견된 치명적 버그를 수정하고, 개발자 워크플로우에 특화된 기능을 추가하여 KeyBox를 경쟁 제품과 명확히 차별화한다.

### 1.2 Background

#### v0.1.0 현황 분석

**구현 완성도 (코드 검증)**

| 기능 | 설계 | 구현 | 상태 |
|------|------|------|------|
| 마스터 패스워드 + Argon2id + HKDF | O | O | 완전 구현 |
| 시크릿 CRUD + 검색 | O | O | 완전 구현 |
| 프로젝트/카테고리 분류 | O | O | 완전 구현 |
| 즐겨찾기(핀) + 뱃지 | O | O | 완전 구현 |
| 원클릭 복사 + 30초 자동 클리어 | O | O | 완전 구현 |
| 자동 잠금 | O | O | 완전 구현 |
| 다크/라이트/시스템 테마 | O | O | 완전 구현 |
| .env 파일 가져오기 | O | O | 완전 구현 |
| 시스템 트레이 | O | O | 완전 구현 |
| 데이터 내보내기/가져오기 | O | 부분 | **버그: 평문 JSON 저장** |
| 설정 영속화 | O | X | **버그: 재시작 시 초기화** |
| 클립보드 클리어 시간 설정 적용 | O | X | **버그: 30초 하드코딩** |

**발견된 치명적 버그 (Must-fix)**

1. **설정 미영속화**: `SettingsModal`이 저장하는 `autoLockMinutes`, `clipboardClearSeconds`, `theme` 값이 Zustand 메모리에만 유지됨. 앱 재시작 시 기본값(5분, 30초, dark)으로 리셋됨.

2. **export 평문 저장 (보안 취약점)**: `export_data` 커맨드가 `secret_value`를 평문 JSON으로 파일시스템에 기록함. 보안 앱의 핵심 기능이 보안 취약점.

3. **클립보드 클리어 시간 미적용**: `copy_to_clipboard` Rust 함수가 30초를 하드코딩. 사용자 설정값이 전달되지 않음.

#### 경쟁 제품 분석

| 기능 | 1Password | Bitwarden | KeePass | KeyBox v0.1 | KeyBox v0.2 목표 |
|------|:---------:|:---------:|:-------:|:-----------:|:----------------:|
| 오프라인 완전 동작 | △ | △ | O | O | O |
| 개발자 카테고리/프로젝트 분류 | X | X | X | O | O |
| .env 파일 가져오기 | X | X | X | O | O |
| .env 파일 내보내기 | X | X | X | X | **O** |
| 만료일 추적 + 알림 | X | X | X | X | **O** |
| SSH 키 타입 지원 | X | X | X | X | **O** |
| 환경(dev/staging/prod) 분리 | X | X | X | O | O |
| 클라우드 동기화 | O | O | X | X | v0.3 예정 |
| 팀 공유 | O | O | X | X | v0.3 예정 |

**차별점**: 개발자 워크플로우에 특화된 기능(프로젝트 분류, .env 연동, 환경 분리, 만료일 추적)은 범용 패스워드 매니저가 제공하지 않는 KeyBox만의 강점이다.

**부족한 점**: 클라우드 동기화 부재로 멀티 디바이스 사용자 이탈 위험. v0.3.0에서 선택적 동기화 검토 필요.

### 1.3 Related Documents

- v0.1.0 Plan: `docs/01-plan/features/keybox.plan.md`
- v0.1.0 Design: `docs/02-design/features/keybox.design.md`

---

## 2. Scope

### 2.1 In Scope (v0.2.0)

#### Must — 반드시 수정/구현 (버그 수정)
- [x] 설정 영속화: `autoLockMinutes`, `clipboardClearSeconds`, `theme` SQLite 저장/로드
- [x] export 암호화: 내보내기 파일을 마스터 패스워드로 암호화 (AES-256-GCM)
- [x] 클립보드 클리어 시간 설정 적용: Rust `copy_to_clipboard`에 설정값 전달

#### Should — 핵심 차별화 기능
- [ ] 만료일(Expiry Date) 필드: 시크릿에 만료일 설정, 만료 전 7일/당일 UI 알림
- [ ] .env 역내보내기: 선택한 프로젝트의 시크릿을 `.env` 파일로 내보내기
- [ ] SSH 키 타입: `secret_type` 필드 추가 (api_key, token, password, ssh_key, cert, other)
- [ ] 삭제 확인 모달: `confirm()` 브라우저 다이얼로그 → 커스텀 모달로 교체

#### Could — 여유 시 구현
- [ ] 시크릿 값 복사 후 일정 시간 자동 숨김 (reveal 상태 자동 해제)
- [ ] 만료 예정 시크릿 대시보드 위젯 (사이드바 "만료 예정" 섹션)
- [ ] 카테고리/프로젝트 편집 기능 (현재 생성/삭제만 가능)
- [ ] 비밀번호 강도 미터 (password 타입에 한해)

#### Won't — v0.2.0 제외
- 클라우드 동기화 (v0.3.0)
- 팀 공유 기능 (v0.3.0)
- 브라우저 확장 프로그램
- 모바일 앱
- CLI 도구 (v0.3.0 검토)

### 2.2 Out of Scope

- 마스터 패스워드 변경 기능 (데이터 재암호화 복잡도, v0.3.0)
- 2FA/생체인증 (OS Keychain 연동, v0.3.0)
- macOS/Linux 빌드 (Windows 우선 검증 후)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 설정(테마/자동잠금/클립보드 클리어 시간)을 SQLite에 저장하고 앱 시작 시 로드 | Must | Pending |
| FR-02 | 클립보드 클리어 시간 설정값을 Rust copy_to_clipboard에 전달하여 동적 적용 | Must | Pending |
| FR-03 | export_data가 평문 JSON 대신 AES-256-GCM 암호화 바이너리로 저장 | Must | Pending |
| FR-04 | import_data가 암호화된 export 파일을 현재 마스터 패스워드로 복호화하여 가져오기 | Must | Pending |
| FR-05 | 시크릿에 만료일(expiry_date) 필드 추가, SecretForm에서 날짜 입력 | Should | Pending |
| FR-06 | 앱 시작 시 7일 이내 만료 예정 시크릿 목록을 Toast/배지로 표시 | Should | Pending |
| FR-07 | 선택 프로젝트의 시크릿을 KEY=VALUE 형식 .env 파일로 내보내기 | Should | Pending |
| FR-08 | secret_type 필드 추가 (api_key/token/password/ssh_key/cert/other) | Should | Pending |
| FR-09 | SSH 키 타입 선택 시 공개키 별도 입력 필드(public_key) 제공 | Should | Pending |
| FR-10 | 삭제 확인을 커스텀 모달(ConfirmModal)로 교체 | Should | Pending |
| FR-11 | SecretDetail에서 값 보기 상태가 복사 후 30초 뒤 자동 숨김 | Could | Pending |
| FR-12 | 사이드바에 "만료 예정" 섹션 추가 (7일 이내 만료 시크릿 필터) | Could | Pending |
| FR-13 | 카테고리/프로젝트 이름 및 아이콘/색상 편집 기능 | Could | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | export 파일: AES-256-GCM 암호화, 평문 미포함 | 코드 리뷰 + 파일 hex 검사 |
| Security | 마스터 패스워드 없이 export 파일 복호화 불가 | 수동 테스트 |
| Performance | 설정 로드: 앱 시작 후 200ms 이내 적용 | 수동 측정 |
| Performance | .env 내보내기: 100개 시크릿 기준 1초 이내 | 측정 |
| Usability | 만료 알림을 앱 시작 시 1회만 표시 (반복 알림 방지) | 기능 테스트 |
| Compatibility | 기존 v0.1.0 DB 스키마 마이그레이션 자동 적용 | 통합 테스트 |
| Compatibility | v0.1.0 export 파일(평문 JSON) import 지원 유지 (레거시 호환) | 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01~04 (Must) 모두 구현 및 수동 테스트 통과
- [ ] FR-05~10 (Should) 구현 완료
- [ ] 기존 v0.1.0 DB가 v0.2.0에서 정상 동작 (마이그레이션 확인)
- [ ] Windows NSIS installer 빌드 성공

### 4.2 Quality Criteria

- [ ] export 파일 hex dump에서 평문 시크릿 값 미노출 확인
- [ ] 설정값이 앱 재시작 후 정확히 복원됨 확인
- [ ] Rust 신규 기능 유닛 테스트 작성 (expiry, export 암호화)
- [ ] 빌드 결과물 < 5MB 유지

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| v0.1.0 export 파일(평문 JSON) 사용자가 import 시 실패 | High | High | 파일 시작 바이트로 포맷 자동 감지 (JSON이면 레거시 처리) |
| DB 마이그레이션(expiry_date, secret_type 컬럼 추가) 실패 | High | Low | IF NOT EXISTS + ALTER TABLE 패턴, 기존 방식 동일하게 적용 |
| export 암호화 포맷 변경으로 버전 간 호환성 문제 | Medium | Medium | ExportData.version 필드 활용 (v1=평문, v2=암호화) |
| 만료일 UI에서 날짜 입력 UX 복잡도 증가 | Low | Medium | HTML5 date input 사용, 선택사항으로 설정 |
| 설정 영속화 시 기존 사용자 설정 덮어쓰기 | Low | Low | 앱 시작 시 DB 값 우선, 기본값 fallback |

---

## 6. Architecture Considerations

### 6.1 DB 스키마 변경 (마이그레이션)

```sql
-- v0.2 마이그레이션: secrets 테이블 컬럼 추가
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS expiry_date TEXT;      -- ISO 8601 date
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS secret_type TEXT DEFAULT 'api_key';
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS public_key TEXT DEFAULT '';

-- 설정 키 추가 (app_config 테이블 재사용)
-- key: 'auto_lock_minutes' → value: BLOB (숫자)
-- key: 'clipboard_clear_seconds' → value: BLOB (숫자)
-- key: 'theme' → value: BLOB ('light'|'dark'|'system')
```

### 6.2 export 포맷 변경

```
현재 (v1, 평문):  JSON 텍스트 파일
→ 변경 (v2, 암호화):
   [4 bytes] 매직넘버 "KBEX"
   [4 bytes] 버전 (u32 LE, 값=2)
   [12 bytes] nonce
   [N bytes] AES-256-GCM 암호화된 JSON
   [16 bytes] GCM tag (aes-gcm 라이브러리가 자동 포함)
```

### 6.3 Rust 변경 사항

| 파일 | 변경 내용 |
|------|----------|
| `src-tauri/src/commands/export.rs` | export 암호화 구현, import 레거시 감지 |
| `src-tauri/src/commands/secret.rs` | `copy_to_clipboard`에 `clear_seconds: u64` 파라미터 추가 |
| `src-tauri/src/commands/auth.rs` | 설정 저장/로드 커맨드 추가 (`save_settings`, `load_settings`) |
| `src-tauri/src/db/migrations.rs` | expiry_date, secret_type, public_key 컬럼 마이그레이션 |
| `src-tauri/src/models/secret.rs` | `Secret` 구조체에 신규 필드 추가 |

### 6.4 Frontend 변경 사항

| 파일 | 변경 내용 |
|------|----------|
| `src/components/SettingsModal.tsx` | 저장 시 `save_settings` IPC 호출 |
| `src/App.tsx` or `src/pages/MainScreen.tsx` | 앱 시작 시 `load_settings` IPC 호출 |
| `src/components/SecretForm.tsx` | expiry_date, secret_type, public_key 필드 추가 |
| `src/components/SecretDetail.tsx` | 만료일 표시, 만료 예정 배지, confirm 모달 교체 |
| `src/components/ConfirmModal.tsx` | 신규: 커스텀 확인 다이얼로그 |
| `src/lib/commands.ts` | 신규 IPC 커맨드 바인딩 추가 |

---

## 7. Convention Prerequisites

### 7.1 기존 규칙 (v0.1.0에서 확립됨)

- TypeScript: camelCase 함수, PascalCase 컴포넌트/타입
- Rust: snake_case 함수/파일, PascalCase 구조체
- Tauri IPC: `verb_noun` 패턴 (`save_settings`, `load_settings`)
- 에러: Rust `AppError` enum → Frontend Toast

### 7.2 v0.2.0에서 추가할 규칙

| Category | Rule | Priority |
|----------|------|:--------:|
| Export 포맷 | 매직넘버 "KBEX" + 버전 헤더 필수 | High |
| 날짜 형식 | ISO 8601 (`YYYY-MM-DD`) 통일 | Medium |
| Secret Type | `api_key \| token \| password \| ssh_key \| cert \| other` enum 값 | High |

---

## 8. v0.3.0 로드맵 힌트

v0.2.0 이후 탐색할 방향:

| 기능 | 비고 |
|------|------|
| 마스터 패스워드 변경 | 전체 데이터 재암호화 필요 |
| 선택적 클라우드 동기화 | E2E 암호화 필수, iCloud/Google Drive 파일 기반 |
| CLI 도구 (`keybox get <name>`) | Tauri 외부 프로세스 또는 별도 Rust 바이너리 |
| OS Keychain 통합 | keyring crate 활용, 마스터 패스워드 기억 |
| Windows Hello / Touch ID | 2차 인증 강화 |
| 시크릿 히스토리 (변경 이력) | 이전 값 복원 기능 |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design keybox-v0.2.0`)
2. [ ] Must 버그 수정 구현 (설정 영속화, export 암호화, 클립보드 시간 적용)
3. [ ] Should 기능 구현 (만료일, .env 역내보내기, secret_type)
4. [ ] Windows 빌드 및 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-17 | Initial v0.2.0 plan (버그 수정 + 개발자 워크플로우 특화) | kang9 |
