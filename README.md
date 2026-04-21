# R-Code

<p align="center">
  <strong>A secure, lightweight code editor for macOS</strong><br>
  Built with Tauri + Rust + Next.js
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-blue" alt="Platform">
  <img src="https://img.shields.io/badge/version-1.0.0-green" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-purple" alt="License">
</p>

---

## About

R-Code is a professional, offline-first code editor designed for developers who value speed, security, and independence. It runs natively on macOS without requiring internet connectivity or cloud services.

### Core Principles

- **Offline-first**: No internet required - works completely offline
- **Local-first**: All operations happen locally on your machine
- **Independent**: No cloud sync, no account required, no telemetry
- **Secure**: Sandboxed file operations, path validation, input limits
- **Professional**: Production-ready with comprehensive security

---

## Features

### Editor
- **Syntax Highlighting**: 12+ languages (JavaScript, TypeScript, Python, Rust, JSON, Markdown, HTML, CSS, SQL, C++, Java)
- **Multiple Tabs**: Edit multiple files simultaneously with tabbed interface
- **Find & Replace**: Search across files with regex support
- **Keyboard-first**: Full keyboard navigation and shortcuts

### Git Integration
- View repository status
- Stage/unstage files
- Commit changes
- View diffs
- Branch management (create, switch, list)
- Push, pull, fetch operations

### Developer Tools
- **Integrated Terminal**: Run shell commands without leaving the editor
- **File Explorer**: Navigate project files in the sidebar
- **Command Palette**: Quick access to all commands

### Security
- Sandboxed to home directory
- Path traversal protection
- System directory blocking
- Input length limits (1MB max)
- Command allowlist (no arbitrary execution)
- Content Security Policy enforced

---

## Requirements

| Requirement | Version |
|------------|---------|
| macOS | 12.0 (Monterey) or later |
| Apple Silicon or Intel | M-series or x86_64 |

---

## Installation

### Option 1: Download DMG

Download the latest `.dmg` from [Releases](https://github.com/pallab-js/r-code/releases) and drag to Applications.

### Option 2: Build from Source

```bash
# Clone repository
git clone https://github.com/pallab-js/r-code.git
cd r-code

# Install dependencies
npm install

# Build production app
npm run tauri:build
```

The built app is located at: `src-tauri/target/release/r-code.app`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---------|-------|
| `Cmd + N` | New file |
| `Cmd + O` | Open file |
| `Cmd + S` | Save file |
| `Cmd + Shift + F` | Search in project |
| `Cmd + Shift + G` | Git panel |
| `Cmd + `` | Toggle terminal |
| `Cmd + ,` | Settings |
| `Cmd + Shift + P` | Command palette |

---

## Configuration

User settings are stored at:
```
~/Library/Application Support/r-code/settings.json
```

Default settings:
```json
{
  "fontSize": 14,
  "fontFamily": "monospace",
  "tabSize": 2,
  "theme": "dark"
}
```

---

## Architecture

```
r-code/
├── src/                      # Next.js frontend
│   ├── app/                  # App router pages
│   ├── components/          # React components
│   │   ├── Editor/          # CodeMirror editor
│   │   ├── Git/            # Git panels
│   │   ├── Search/         # Search panels
│   │   ├── Sidebar/        # File tree
│   │   ├── Terminal/       # Terminal
│   │   └── ...
│   └── lib/                 # Context & hooks
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands
│   │   ├── commands.rs     # File operations
│   │   ├── git.rs         # Git operations
│   │   ├── highlight.rs    # Syntax highlighting
│   │   └── search.rs      # Search operations
│   └── tauri.conf.json     # App configuration
└── package.json
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Tauri 2.x |
| Backend | Rust |
| Frontend | Next.js 16 |
| Styling | Tailwind CSS 4 |
| Editor | CodeMirror 6 |
| Highlighting | syntect |

---

## Security Model

### File Operations
- Sandboxed to user's home directory
- Path traversal blocked (`..` denied)
- System directories blocked (`/etc`, `/proc`, `/System`, etc.)
- File size limit: 10MB max
- Input length limit: 1MB max

### Execution
- Command allowlist: only safe system commands (`ls`, `git`, `npm`, `grep`, etc.)
- Dangerous arguments blocked (`-rf`, `--force`, etc.)
- Malicious patterns blocked (fork bombs, recursive deletion)

### Content Security Policy
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
connect-src 'self' ipc: tauri:; img-src 'self' data:; font-src 'self' data:
```

---

## Troubleshooting

### App won't open
1. Right-click the app → "Open" → "Open" to bypass Gatekeeper
2. Or: `xattr -cr /Applications/r-code.app`

### Terminal not working
Ensure your shell (`/bin/zsh`) is available and in PATH.

### Git operations fail
Ensure Git is installed: `git --version`

---

## Development

```bash
# Development server
npm run tauri:dev

# Run tests
npm run test:run

# Type check
npm run lint

# Build frontend
npm run build
```

---

## License

MIT License - See [LICENSE](LICENSE)

---

## Acknowledgments

- [Cursor](https://cursor.sh) - Design inspiration
- [Tauri](https://tauri.app) - Desktop framework
- [CodeMirror](https://codemirror.net) - Text editor
- [syntect](https://github.com/trishume/syntect) - Rust syntax highlighting