# KeyBox

> Developer Secret Manager — API keys & tokens, secured locally.

A lightweight desktop app for developers to securely manage API keys, tokens, and secrets with **AES-256-GCM encryption**. No cloud, no subscription, no tracking. Just a single master password protecting everything on your machine.

Built with **Tauri v2 + React + Rust**.

## Why KeyBox?

- **For developers, by developers** — organize secrets by project, category, and environment (dev/staging/prod)
- **Import .env files** — drag and drop your `.env` files to auto-register all keys
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
