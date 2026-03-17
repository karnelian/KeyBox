# KeyBox

> Developer Secret Manager — API keys & tokens, secured locally.
>
> **[한국어](#한국어)** | English

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
| Projects & Categories | Organize secrets with color-coded projects and icon categories |
| Favorites | Pin frequently used secrets to the top |
| One-click Copy | Copy to clipboard with configurable auto-clear timer |
| .env Import | Parse and import `.env` files into any project |
| Encrypted Export | Backup your vault with AES-256-GCM encrypted files |
| Auto-lock | Configurable inactivity timeout |
| System Tray | Background mode with tray menu (Show / Lock / Quit) |
| Themes | Dark / Light / System |
| Keyboard Shortcuts | `Ctrl+N` new, `Ctrl+F` search, `Ctrl+I` import .env, `Ctrl+L` lock |

## Screenshots

*Coming soon*

## Installation

### Download

Download the latest installer from [Releases](https://github.com/karnelian/KeyBox/releases).

- **Windows**: `KeyBox_x.x.x_x64-setup.exe` (3MB NSIS installer)
- **Portable**: `keybox.exe` (12MB, no installation needed)

### Build from Source

**Prerequisites:**
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

```bash
# Clone
git clone https://github.com/karnelian/KeyBox.git
cd KeyBox

# Install frontend dependencies
npm install

# Run in development mode
cargo tauri dev

# Build release
cargo tauri build
```

## Security

KeyBox uses industry-standard cryptography:

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

- Master password is **never stored** — only a verification hash derived from it
- Each secret value is individually encrypted with a **unique random nonce**
- Encryption key exists only in memory and is cleared on lock
- Clipboard is automatically cleared after a configurable timeout
- Export files are encrypted with the same AES-256-GCM scheme

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
│   ├── components/         # UI components (12)
│   ├── stores/             # Zustand stores (4)
│   ├── types/              # TypeScript types
│   └── lib/                # Tauri IPC wrapper, utilities
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC commands (19)
│   │   ├── crypto/         # Argon2id, AES-256-GCM, HKDF
│   │   ├── db/             # SQLite connection, migrations, queries
│   │   ├── models/         # Data models
│   │   ├── tray.rs         # System tray
│   │   └── state.rs        # App state (encryption key)
│   └── tauri.conf.json
└── docs/                   # PDCA documentation
```

## Roadmap

- [ ] Secret expiry date tracking
- [ ] .env export (reverse)
- [ ] Master password change
- [ ] Brute-force protection (delay after failed attempts)
- [ ] Auto-updater (tauri-plugin-updater)
- [ ] macOS / Linux builds

## License

MIT

## Contributing

Issues and Pull Requests are welcome! Please read the existing code style before contributing.

---

# 한국어

> 개발자를 위한 시크릿 매니저 — API 키와 토큰을 로컬에서 안전하게 관리합니다.

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
| 프로젝트 & 카테고리 | 색상 코드 프로젝트와 아이콘 카테고리로 분류 |
| 즐겨찾기 | 자주 쓰는 시크릿을 상단에 고정 |
| 원클릭 복사 | 클립보드 복사 + 자동 클리어 (시간 설정 가능) |
| .env 가져오기 | `.env` 파일을 파싱하여 프로젝트에 자동 등록 |
| 암호화 내보내기 | AES-256-GCM으로 암호화된 백업 파일 생성 |
| 자동 잠금 | 비활성 시간 초과 시 자동 잠금 (시간 설정 가능) |
| 시스템 트레이 | 백그라운드 실행 + 트레이 메뉴 (열기/잠금/종료) |
| 테마 | 다크 / 라이트 / 시스템 |
| 키보드 단축키 | `Ctrl+N` 새 시크릿, `Ctrl+F` 검색, `Ctrl+I` .env 가져오기, `Ctrl+L` 잠금 |

## 스크린샷

*준비 중*

## 설치

### 다운로드

[Releases](https://github.com/karnelian/KeyBox/releases) 페이지에서 최신 버전을 다운로드하세요.

- **Windows**: `KeyBox_x.x.x_x64-setup.exe` (3MB 설치 파일)
- **포터블**: `keybox.exe` (12MB, 설치 없이 바로 실행)

### 소스에서 빌드

**사전 요구사항:**
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

```bash
# 클론
git clone https://github.com/karnelian/KeyBox.git
cd KeyBox

# 프론트엔드 의존성 설치
npm install

# 개발 모드 실행
cargo tauri dev

# 릴리스 빌드
cargo tauri build
```

## 보안

KeyBox는 업계 표준 암호화를 사용합니다:

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

- 마스터 패스워드는 **절대 저장되지 않음** — 파생된 검증 해시만 저장
- 각 시크릿 값은 **고유한 랜덤 nonce**로 개별 암호화
- 암호화 키는 메모리에만 존재하며 잠금 시 즉시 제거
- 클립보드는 설정한 시간 후 자동 클리어
- 내보내기 파일도 동일한 AES-256-GCM으로 암호화

## 기술 스택

| 계층 | 기술 |
|------|------|
| 데스크톱 프레임워크 | [Tauri v2](https://tauri.app/) |
| 프론트엔드 | React 19 + TypeScript + Vite |
| 스타일링 | Tailwind CSS v4 |
| 상태관리 | Zustand |
| 백엔드 | Rust |
| 암호화 | argon2, aes-gcm, hkdf (Rust crates) |
| 데이터베이스 | SQLite (rusqlite) |
| 클립보드 | tauri-plugin-clipboard-manager |

## 로드맵

- [ ] 시크릿 만료일 추적
- [ ] .env 역내보내기
- [ ] 마스터 패스워드 변경
- [ ] 브루트포스 방지 (실패 시 지연)
- [ ] 자동 업데이트 (tauri-plugin-updater)
- [ ] macOS / Linux 빌드

## 라이선스

MIT

## 기여

Issue와 Pull Request를 환영합니다! 기여 전 기존 코드 스타일을 참고해주세요.
