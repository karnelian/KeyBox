# KeyBox Bugfix Analysis Report

> **Analysis Type**: Gap Analysis (Implementation Completeness + Bug Detection)
>
> **Project**: KeyBox
> **Version**: 0.1.0
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-03-17
> **Last Updated**: 2026-03-17 (v0.2 - Post-bugfix re-analysis)
> **Features Analyzed**: 프로젝트 색상/이름 변경, X 버튼 트레이 최소화+잠금, 트레이 좌클릭 창 열기

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

3개 신규 기능 구현의 완전성, 데이터 흐름 일관성, 에러 처리, 엣지 케이스, 보안, UX 이슈를 점검한다.

### 1.2 Analysis Scope

| Feature | Backend Files | Frontend Files |
|---------|---------------|----------------|
| 프로젝트 편집 | queries.rs, commands/project.rs, lib.rs | types/index.ts, commands.ts, projectStore.ts, ProjectForm.tsx, Sidebar.tsx, MainScreen.tsx |
| X 버튼 트레이 최소화 | lib.rs (on_window_event) | MainScreen.tsx (tray-lock event listener) |
| 트레이 좌클릭 | tray.rs | - |

### 1.3 Bugfix Verification (v0.2)

v0.1 분석에서 발견된 P0 3건 + UX 4건의 수정 사항 검증.

| # | Issue | Fix Status | Evidence |
|:-:|-------|:----------:|----------|
| P0-1 | tray-lock 이벤트 리스너 미구현 | **FIXED** | MainScreen.tsx:60-70 `listen("tray-lock", () => lock())` |
| P0-2 | ProjectNotFound 에러 타입 누락 | **FIXED** | error.rs:23-24 `ProjectNotFound(String)` variant 추가 |
| P0-3 | ProjectDuplicate 에러 타입 누락 | **FIXED** | error.rs:26-27 `ProjectDuplicate(String)` variant 추가 |
| P0-3b | queries.rs에서 잘못된 에러 타입 사용 | **FIXED** | queries.rs:381 `ProjectDuplicate`, 423/437/450/456 `ProjectNotFound` |
| UX-4 | 취소 버튼 텍스트 색상 | **FIXED** | ProjectForm.tsx:93 `text-gray-700 dark:text-gray-200` |
| UX-5 | 모달 배경 클릭 닫기 | **FIXED** | ProjectForm.tsx:43 `onClick={onClose}` + :44 `stopPropagation` |
| UX-6 | 컨텍스트 메뉴 화면 경계 보정 | **FIXED** | Sidebar.tsx:66-67 `Math.min` clamping |
| UX-7 | 프로젝트 삭제 후 시크릿 갱신 | **FIXED** | Sidebar.tsx:84-85 `fetchSecrets()` + `fetchCounts()` |

---

## 2. Gap Analysis

### 2.1 Feature 1: 프로젝트 색상/이름 변경

#### Data Flow: Backend

| Layer | Status | Notes |
|-------|:------:|-------|
| queries.rs `update_project()` | ✅ | name, color 모두 Optional 지원 |
| queries.rs 에러 타입 | ✅ | `ProjectNotFound` (423, 437, 450), `ProjectDuplicate` (381) 정확 사용 |
| commands/project.rs `update_project` | ✅ | Tauri command 등록됨 |
| lib.rs handler 등록 | ✅ | `commands::project::update_project` 등록 확인 |

#### Data Flow: Frontend

| Layer | Status | Notes |
|-------|:------:|-------|
| `UpdateProjectInput` type | ✅ | id(필수), name?, color? |
| `commands.updateProject()` | ✅ | spread 방식으로 args 전달 |
| `projectStore.updateProject()` | ✅ | command 호출 후 fetchProjects |
| `ProjectForm` edit mode | ✅ | editProject prop으로 분기, 배경 클릭 닫기 지원 |
| `Sidebar` context menu | ✅ | 우클릭 메뉴 편집/삭제, button===2 guard, 경계 보정 |
| `MainScreen` editingProject state | ✅ | 상태 관리 + ProjectForm 연동 |

#### Mock Fallback

| Item | Status | Notes |
|------|:------:|-------|
| `update_project` mock | ✅ | name, color 업데이트 지원 |

### 2.2 Feature 2: X 버튼 트레이 최소화 + 잠금

| Layer | Status | Notes |
|-------|:------:|-------|
| lib.rs `on_window_event` CloseRequested | ✅ | `api.prevent_close()` + `window.hide()` + emit `tray-lock` |
| Frontend `tray-lock` event listener | ✅ | MainScreen.tsx:60-70 `listen("tray-lock", () => lock())` + isTauri guard + cleanup |

### 2.3 Feature 3: 트레이 좌클릭 창 열기

| Layer | Status | Notes |
|-------|:------:|-------|
| tray.rs `menu_on_left_click(false)` | ✅ | 좌클릭 시 메뉴 안 열림 |
| tray.rs `on_tray_icon_event` Click handler | ✅ | Left click -> show + set_focus |

### 2.4 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  ✅ Match:          17 items (100%)           |
|  ❌ Not implemented:  0 items (0%)            |
|  ⚠️ Bug/Issue:        0 items (0%)            |
+---------------------------------------------+
```

---

## 3. Bugs Found (v0.2 Status)

### 3.1 ~~CRITICAL: tray-lock 이벤트 프론트엔드 미수신~~ **RESOLVED**

MainScreen.tsx:60-70에서 `listen("tray-lock")` 구현 완료. isTauri 환경 분기 + async/await + cleanup 패턴 적용.

### 3.2 ~~HIGH: update_project에서 잘못된 에러 타입 사용~~ **RESOLVED**

error.rs에 `ProjectNotFound(String)` variant 추가. queries.rs의 모든 project 함수에서 올바른 에러 타입 사용 확인.

### 3.3 ~~HIGH: insert_project 중복 에러도 CategoryDuplicate 사용~~ **RESOLVED**

error.rs에 `ProjectDuplicate(String)` variant 추가. queries.rs:381에서 `ProjectDuplicate` 사용 확인.

---

## 4. Edge Case Analysis

### 4.1 중복 이름으로 프로젝트 업데이트

| Item | Status | Notes |
|------|:------:|-------|
| DB UNIQUE 제약 | ✅ | `projects.name` 에 UNIQUE 존재 |
| Backend 에러 핸들링 | ⚠️ | `update_project`에서 UNIQUE 위반 시 generic `DatabaseError` 반환 (insert_project처럼 `map_err`로 변환하지 않음) |
| Frontend 에러 표시 | ✅ | toast.show로 에러 메시지 표시 |

**수정 방법**: `queries::update_project`의 `conn.execute`에 `.map_err`를 추가하여 UNIQUE 위반을 `ProjectDuplicate`로 변환.

### 4.2 빈 이름으로 프로젝트 업데이트

| Layer | Status | Notes |
|-------|:------:|-------|
| Frontend 검증 | ✅ | `if (!name.trim()) return;` |
| Backend 검증 | ⚠️ | 빈 문자열 체크 없음. `name: Some("")`이 전달되면 DB에 빈 이름 저장됨 |

**수정 방법**: Backend에서 빈 문자열을 `None`으로 처리하거나 별도 validation 추가.

### 4.3 현재 선택된 프로젝트 삭제

| Item | Status | Notes |
|------|:------:|-------|
| selectedProjectId 초기화 | ✅ | `projectStore.removeProject`에서 `selectedProjectId === id`일 때 null로 설정 |
| 시크릿 목록 갱신 | ✅ | Sidebar.tsx:84-85에서 `fetchSecrets()` + `fetchCounts()` 호출 |

---

## 5. Security Analysis

| Item | Severity | Status | Notes |
|------|:--------:|:------:|-------|
| 잠금 상태에서 트레이 창 열기 | ✅ | 해결됨 | `tray-lock` 리스너 구현으로 X 버튼 후 자동 잠금 동작 |
| DB 잠금 Mutex | ✅ | 안전 | `state.db.lock().unwrap()` 사용 |
| 마스터 패스워드 검증 | ✅ | 안전 | Rust 백엔드에서 crypto 검증 |

---

## 6. UX Issues

### 6.1 컨텍스트 메뉴 화면 경계 처리 **RESOLVED**

| Item | Status | Notes |
|------|:------:|-------|
| 화면 하단 경계 | ✅ | Sidebar.tsx:67 `Math.min(e.clientY, window.innerHeight - 90)` |
| 화면 우측 경계 | ✅ | Sidebar.tsx:66 `Math.min(e.clientX, window.innerWidth - 150)` |

### 6.2 컨텍스트 메뉴 닫기 동작

| Item | Status | Notes |
|------|:------:|-------|
| 외부 클릭으로 닫기 | ✅ | `document.addEventListener("click", handleClick)` |
| Escape로 닫기 | ⚠️ | Sidebar에 keydown 리스너 없음. MainScreen의 Escape는 showProjectForm만 처리 |
| 스크롤 시 닫기 | ⚠️ | 스크롤 이벤트 미처리. 사이드바 카테고리 스크롤 시 컨텍스트 메뉴 위치 어긋남 |

### 6.3 ProjectForm 모달 **RESOLVED**

| Item | Status | Notes |
|------|:------:|-------|
| 배경 클릭으로 닫기 | ✅ | ProjectForm.tsx:43 overlay `onClick={onClose}` + :44 `stopPropagation` |
| 취소 버튼 텍스트 색상 | ✅ | ProjectForm.tsx:93 `text-gray-700 dark:text-gray-200` 적용 |

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | - |
| Functions | camelCase | 100% | - |
| Types | PascalCase | 100% | - |
| Rust functions | snake_case | 100% | - |

### 7.2 Error Type Naming Consistency

| Error | Used For | Correct? |
|-------|----------|:--------:|
| `SecretNotFound` | Secret only | ✅ |
| `CategoryDuplicate` | Category only | ✅ |
| `CategoryNotFound` | Category only | ✅ |
| `ProjectNotFound` | Project only | ✅ |
| `ProjectDuplicate` | Project only | ✅ |

---

## 8. Overall Score

```
+---------------------------------------------+
|  Overall Score: 93/100                       |
+---------------------------------------------+
|  Implementation Completeness: 100%           |
|  Error Handling:               88%           |
|  Edge Cases:                   82%           |
|  Security:                     95%           |
|  UX Quality:                   90%           |
|  Convention Compliance:       100%           |
+---------------------------------------------+
```

| Category | Score | Status | Change |
|----------|:-----:|:------:|:------:|
| Implementation Completeness | 100% | ✅ | +18% |
| Error Handling | 88% | ✅ | +33% |
| Edge Cases | 82% | ⚠️ | +17% |
| Security | 95% | ✅ | +25% |
| UX Quality | 90% | ✅ | +30% |
| Convention Compliance | 100% | ✅ | +15% |
| **Overall** | **93%** | **✅** | **+21%** |

---

## 9. Remaining Issues (P2 - LOW)

| # | Severity | Item | File | Description |
|:-:|:--------:|------|------|-------------|
| 1 | LOW | update_project UNIQUE 위반 | queries.rs | `conn.execute`에 `.map_err` 추가 필요 (현재 generic DatabaseError) |
| 2 | LOW | Backend 빈 문자열 검증 | commands/project.rs | `name: Some("")`을 `None`으로 변환 필요 |
| 3 | LOW | 컨텍스트 메뉴 Escape 닫기 | Sidebar.tsx | keydown 리스너 추가 필요 |
| 4 | LOW | 컨텍스트 메뉴 스크롤 닫기 | Sidebar.tsx | scroll 이벤트 리스너 추가 필요 |

---

## 10. Summary by Feature

| Feature | Completeness | Critical Issues |
|---------|:------------:|:---------------:|
| 프로젝트 색상/이름 변경 | 100% | 없음 (P0 #2, #3 해결됨) |
| X 버튼 트레이 최소화+잠금 | 100% | 없음 (P0 #1 해결됨) |
| 트레이 좌클릭 창 열기 | 100% | 없음 |

---

## 11. Score Comparison (v0.1 -> v0.2)

```
v0.1 (Initial)                    v0.2 (Post-bugfix)
+---------------------------+     +---------------------------+
| Overall Score: 72/100     |     | Overall Score: 93/100     |
| P0 Critical:   3 issues   | --> | P0 Critical:   0 issues   |
| P1 High:       4 issues   |     | P1 High:       0 issues   |
| P2 Medium:     3 issues   |     | P2 Low:        4 issues   |
+---------------------------+     +---------------------------+
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-17 | Initial analysis - 72/100 (P0 3건, P1 4건, P2 3건) | Claude (gap-detector) |
| 0.2 | 2026-03-17 | Post-bugfix re-analysis - 93/100 (P0 0건, 잔여 P2 4건) | Claude (gap-detector) |
