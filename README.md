# R-Code

A secure, lightweight code editor built with Tauri, Rust, Next.js, and TypeScript.

## Features

- **Fast & Lightweight**: Binary size under 10MB
- **Secure**: All file operations via secure Tauri commands
- **Syntax Highlighting**: Rust-based highlighting for JSON, Markdown, and more
- **Git Integration**: Stage, commit, view diffs directly in the editor
- **Search & Replace**: Find and replace across your entire project
- **Multiple Tabs**: Edit multiple files simultaneously
- **Integrated Terminal**: Run shell commands without leaving the editor
- **Light & Dark Themes**: Cursor-inspired warm color palette

## Screenshots

*(Screenshots coming soon)*

## Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/r-code.git
cd r-code

# Install dependencies
npm install

# Run in development
npm run tauri:dev
```

### Building

```bash
# Build for production
npm run tauri:build
```

The macOS app will be in `src-tauri/target/release/r-code.app`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New file |
| `Cmd/Ctrl + O` | Open file |
| `Cmd/Ctrl + S` | Save file |
| `Cmd/Ctrl + Shift + S` | Save as |
| `Cmd/Ctrl + F` | Find in file |
| `Cmd/Ctrl + Shift + F` | Search in project |
| `Cmd/Ctrl + Shift + G` | Git panel |
| `Cmd/Ctrl + \`` | Toggle terminal |
| `Cmd/Ctrl + ,` | Settings |

## Technology Stack

| Technology | Role |
|------------|------|
| **Rust** | Backend, file operations, syntax highlighting |
| **Tauri** | Desktop runtime, IPC |
| **Next.js** | Frontend UI |
| **Tailwind CSS** | Styling |
| **TypeScript** | Type safety |
| **CodeMirror 6** | Text editing |
| **syntect** | Syntax highlighting |

## Project Structure

```
r-code/
├── src/                    # Next.js frontend
│   ├── app/               # Pages
│   ├── components/        # React components
│   ├── lib/              # Context providers
│   └── styles/           # Global CSS
├── src-tauri/             # Rust backend
│   ├── src/              # Rust source
│   └── tauri.conf.json   # Configuration
└── .planning/             # Development plans
```

## Configuration

Settings are stored in:
- macOS: `~/Library/Application Support/r-code/settings.json`
- Linux: `~/.config/r-code/settings.json`
- Windows: `%APPDATA%/r-code/settings.json`

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build frontend only
npm run build
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Design inspired by [Cursor](https://cursor.sh)
- Built with [Tauri](https://tauri.app)
- Text editing powered by [CodeMirror](https://codemirror.net)
