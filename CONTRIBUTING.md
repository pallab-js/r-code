# Contributing to R-Code

Thank you for your interest in contributing to R-Code!

## Development Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- npm or pnpm

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/r-code.git
   cd r-code
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
r-code/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Context providers
│   └── styles/           # Global CSS
├── src-tauri/             # Rust backend
│   ├── src/              # Rust source
│   │   ├── main.rs       # Entry point
│   │   ├── lib.rs        # Exports
│   │   ├── commands.rs   # Tauri commands
│   │   ├── git.rs        # Git operations
│   │   └── search.rs     # Search operations
│   └── tauri.conf.json   # Tauri configuration
└── .planning/            # GSD planning artifacts
```

## Coding Standards

### Rust

- Run `cargo fmt` before committing
- Run `cargo clippy` to catch common mistakes
- Add unit tests for new functions
- Document public APIs with comments

### TypeScript/React

- Use TypeScript strict mode
- Follow existing component patterns
- Use functional components with hooks
- Export types for component props

### Git Commits

We follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: code style changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test` and `cargo test`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Reporting Issues

- Use GitHub Issues for bug reports
- Include your OS, Node version, and Rust version
- Provide steps to reproduce
- Include relevant logs or screenshots

## Questions?

- Open a GitHub Discussion
- Join our Discord server

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
