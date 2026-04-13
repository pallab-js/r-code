# Developer Guide

This guide explains how to extend and customize R-Code.

## Architecture Overview

R-Code uses a two-tier architecture:

1. **Frontend (Next.js)**: User interface and state management
2. **Backend (Rust/Tauri)**: File operations, Git, search, syntax highlighting

Communication happens via Tauri commands (IPC).

## Adding a New Tauri Command

### 1. Create the Command in Rust

Edit `src-tauri/src/main.rs` or create a new module:

```rust
#[tauri::command]
async fn my_command(param: String) -> Result<String, String> {
    // Your logic here
    Ok(format!("Result: {}", param))
}
```

### 2. Register the Command

In `main.rs`, add to the invoke handler:

```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    my_command,
])
```

### 3. Call from Frontend

```typescript
const result = await invoke<string>('my_command', { param: 'value' })
```

## Adding a New Component

### 1. Create the Component

```typescript
// src/components/MyComponent/MyComponent.tsx
'use client'

interface MyComponentProps {
  title: string
}

export default function MyComponent({ title }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}
```

### 2. Import and Use

```typescript
import MyComponent from '@/components/MyComponent/MyComponent'
```

## Adding a New Theme

Edit `src/styles/globals.css`:

```css
.my-theme {
  --color-bg: #your-bg-color;
  --color-text: #your-text-color;
}
```

## Adding Git Commands

Git commands are in `src-tauri/src/git.rs`:

```rust
pub fn new_git_function(repo_path: &str) -> Result<T, String> {
    // Implementation
}
```

Then expose via Tauri:

```rust
#[tauri::command]
async fn new_git_command(repo_path: String) -> Result<T, String> {
    r_code_lib::new_git_function(&repo_path)
}
```

## Adding Search Functionality

Search is in `src-tauri/src/search.rs`:

```rust
pub fn search_files(dir: &str, query: &str) -> Result<Vec<Match>, String> {
    // Implementation
}
```

## Performance Tips

1. **Lazy load components**: Use `React.lazy()` for panels
2. **Minimize Tauri calls**: Batch operations when possible
3. **Debounce search**: Wait for user input before searching
4. **Use indexes**: For large codebases, index files once

## Debugging

### Frontend
- Open DevTools (F12 or Cmd+Option+I)
- Check Console for errors
- Use React DevTools

### Backend (Rust)
- Check logs in terminal
- Use `log::info!()` for debugging
- Run with `RUST_LOG=debug`

## Building for Production

```bash
npm run tauri:build
```

The binary will be in `src-tauri/target/release/r-code`.

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Next.js Documentation](https://nextjs.org/docs)
- [CodeMirror Documentation](https://codemirror.net/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
