<div align="center">

# KeyBox

**Developer Secret Manager — API keys & tokens, secured locally.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d4)](https://github.com/karnelian/KeyBox/releases)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%20v2-ffc131)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Backend-Rust-dea584)](https://www.rust-lang.org/)

**[English](#why-keybox)** | **[한국어](#한국어)**

</div>

---

A lightweight desktop app for developers to securely manage API keys, tokens, and secrets with **AES-256-GCM encryption**. No cloud, no subscription, no tracking. Just a single master password protecting everything on your machine.

Built with **Tauri v2 + React + Rust**.

## Why KeyBox?

- **For developers, by developers** — organize secrets by project, category, and environment (dev/staging/prod)
- **Import .env files** — select your `.env` files to auto-register all keys
- **Offline-first** — everything stays on your machine, encrypted in a local SQLite database
- **Lightweight** — 3MB installer, ~12MB portable exe. No Electron bloat

## Features

| Feature | Description |
|---------|-------------|
| Master Password | Argon2id key derivation + HKDF separation + AES-256-GCM |
| Secret Management | CRUD with search, tags, and environment labels |
| Projects & Categories | Color-coded projects (right-click to edit) and icon categories |
| Favorites | Pin frequently used secrets to the top |
| One-click Copy | Copy to clipboard with configurable auto-clear timer |
| .env Import | Parse and import `.env` files into any project |
| Encrypted Export | Backup your vault with AES-256-GCM encrypted files |
| Auto-lock | Configurable inactivity timeout |
| Close to Tray | X button minimizes to tray with auto-lock for security |
| System Tray | Left-click to restore, right-click for menu (Show / Lock / Quit) |
| Password Change | Change master password with automatic re-encryption of all secrets |
| Themes | Dark / Light / System |
| Keyboard Shortcuts | `Ctrl+N` new, `Ctrl+F` search, `Ctrl+I` import, `Ctrl+L` lock, `Ctrl+,` settings |

## Screenshots

*Coming soon*

## Getting Started

### Download

Download the latest installer from [**Releases**](https://github.com/karnelian/KeyBox/releases).

| Platform | File | Size |
|----------|------|------|
| Windows (installer) | `KeyBox_x.x.x_x64-setup.exe` | ~3MB |
| Windows (portable) | `keybox.exe` | ~12MB |

### Build from Source

**Prerequisites:**
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

```bash
git clone https://github.com/karnelian/KeyBox.git
cd KeyBox
npm install
cargo tauri dev       # development
cargo tauri build     # release
```

## Security

KeyBox uses industry-standard cryptography. **No secret value is ever stored in plaintext.**

```
Master Password
    |
    v
Argon2id (t=3, m=64MB, p=4)
    |
    v
master_key (32 bytes)
    |
    +---> HKDF-SHA256("keybox-verify")  --> verify_hash (stored in DB)
    |
    +---> HKDF-SHA256("keybox-encrypt") --> encryption_key (memory only)
                                                |
                                        AES-256-GCM encrypt/decrypt
                                        (unique 12-byte nonce per secret)
```

| Property | Detail |
|----------|--------|
| Master password storage | **Never stored** — only a derived verification hash |
| Per-secret encryption | Each value encrypted with a **unique random nonce** |
| Key lifecycle | Encryption key exists **only in memory**, cleared on lock |
| Clipboard | Auto-cleared after configurable timeout |
| Close behavior | Window hides to tray + **auto-locks** on close |
| Export | Encrypted with AES-256-GCM |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | [Tauri v2](https://tauri.app/) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Backend | Rust |
| Encryption | argon2, aes-gcm, hkdf (Rust crates) |
| Database | SQLite (rusqlite) |
| Clipboard | tauri-plugin-clipboard-manager |

## Project Structure

```
KeyBox/
├── src/                    # React Frontend
│   ├── pages/              # LockScreen, SetupScreen, MainScreen
│   ├── components/         # UI components
│   ├── stores/             # Zustand stores (auth, secret, category, project)
│   ├── types/              # TypeScript interfaces
│   └── lib/                # Tauri IPC wrapper, hooks
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC commands (21)
│   │   ├── crypto/         # Argon2id, AES-256-GCM, HKDF
│   │   ├── db/             # SQLite connection, migrations, queries
│   │   ├── models/         # Data models
│   │   ├── tray.rs         # System tray with close-to-tray
│   │   └── state.rs        # App state (encryption key)
│   └── tauri.conf.json
└── docs/                   # Analysis & reports
```

## Roadmap

- [ ] Secret expiry date tracking
- [ ] .env export (reverse)
- [x] Master password change
- [ ] Brute-force protection (delay after failed attempts)
- [ ] Auto-updater (tauri-plugin-updater)
- [ ] macOS / Linux builds

## Contributing

Issues and Pull Requests are welcome! Please read the existing code style before contributing.

## License

[MIT](LICENSE)

---

<div align="center">

# 한국어

**개발자를 위한 시크릿 매니저 — API 키와 토큰을 로컬에서 안전하게 관리합니다.**

</div>

API 키, 토큰, 시크릿을 **AES-256-GCM 암호화**로 안전하게 관리하는 경량 데스크톱 앱입니다. 클라우드 없이, 구독 없이, 마스터 패스워드 하나로 모든 것을 보호합니다.

**Tauri v2 + React + Rust** 기반.

## 왜 KeyBox인가?

- **개발자를 위해, 개발자가 만든** — 프로젝트, 카테고리, 환경(dev/staging/prod)별로 시크릿 관리
- **.env 파일 가져오기** — `.env` 파일을 선택하면 자동으로 모든 키를 등록
- **오프라인 우선** — 모든 데이터는 로컬 SQLite에 암호화 저장
- **초경량** — 설치 파일 3MB, 포터블 12MB. Electron의 무거움 없이

## 기능

| 기능 | 설명 |
|------|------|
| 마스터 패스워드 | Argon2id 키 파생 + HKDF 분리 + AES-256-GCM 암호화 |
| 시크릿 관리 | 생성/조회/수정/삭제 + 검색, 태그, 환경 라벨 |
| 프로젝트 & 카테고리 | 색상 코드 프로젝트 (우클릭으로 편집) + 아이콘 카테고리 |
| 즐겨찾기 | 자주 쓰는 시크릿을 상단에 고정 |
| 원클릭 복사 | 클립보드 복사 + 자동 클리어 (시간 설정 가능) |
| .env 가져오기 | `.env` 파일을 파싱하여 프로젝트에 자동 등록 |
| 암호화 내보내기 | AES-256-GCM으로 암호화된 백업 파일 생성 |
| 자동 잠금 | 비활성 시간 초과 시 자동 잠금 (시간 설정 가능) |
| 트레이 최소화 | X 버튼 클릭 시 트레이로 숨기고 자동 잠금 |
| 시스템 트레이 | 좌클릭 = 창 열기, 우클릭 = 메뉴 (열기/잠금/종료) |
| 비밀번호 변경 | 마스터 비밀번호 변경 + 전체 시크릿 자동 재암호화 |
| 테마 | 다크 / 라이트 / 시스템 |
| 키보드 단축키 | `Ctrl+N` 새 시크릿, `Ctrl+F` 검색, `Ctrl+I` .env 가져오기, `Ctrl+L` 잠금, `Ctrl+,` 설정 |

## 설치

### 다운로드

[**Releases**](https://github.com/karnelian/KeyBox/releases) 페이지에서 최신 버전을 다운로드하세요.

| 플랫폼 | 파일 | 크기 |
|--------|------|------|
| Windows (설치) | `KeyBox_x.x.x_x64-setup.exe` | ~3MB |
| Windows (포터블) | `keybox.exe` | ~12MB |

### 소스에서 빌드

**사전 요구사항:**
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

```bash
git clone https://github.com/karnelian/KeyBox.git
cd KeyBox
npm install
cargo tauri dev       # 개발 모드
cargo tauri build     # 릴리스 빌드
```

## 보안

KeyBox는 업계 표준 암호화를 사용합니다. **시크릿 값은 절대 평문으로 저장되지 않습니다.**

```
마스터 패스워드
    |
    v
Argon2id (t=3, m=64MB, p=4)
    |
    v
마스터 키 (32 bytes)
    |
    +---> HKDF-SHA256("keybox-verify")  --> 검증 해시 (DB 저장)
    |
    +---> HKDF-SHA256("keybox-encrypt") --> 암호화 키 (메모리만)
                                                |
                                        AES-256-GCM 암호화/복호화
                                        (시크릿마다 고유한 12-byte nonce)
```

| 속성 | 상세 |
|------|------|
| 마스터 패스워드 저장 | **절대 저장 안 함** — 파생된 검증 해시만 저장 |
| 개별 시크릿 암호화 | 각 값은 **고유한 랜덤 nonce**로 개별 암호화 |
| 키 수명주기 | 암호화 키는 **메모리에만** 존재, 잠금 시 즉시 제거 |
| 클립보드 | 설정한 시간 후 자동 클리어 |
| 닫기 동작 | 창을 트레이로 숨기고 **자동 잠금** |
| 내보내기 | AES-256-GCM으로 암호화 |

## 로드맵

- [ ] 시크릿 만료일 추적
- [ ] .env 역내보내기
- [x] 마스터 패스워드 변경
- [ ] 브루트포스 방지 (실패 시 지연)
- [ ] 자동 업데이트 (tauri-plugin-updater)
- [ ] macOS / Linux 빌드

## 기여

Issue와 Pull Request를 환영합니다! 기여 전 기존 코드 스타일을 참고해주세요.

## 라이선스

[MIT](LICENSE)
