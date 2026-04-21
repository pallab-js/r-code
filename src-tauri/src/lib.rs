pub mod commands;
pub mod git;
pub mod highlight;
pub mod search;

#[cfg(test)]
mod lib_tests;

use git::{get_git_status, get_git_diff, git_stage_files as stage_files, git_unstage_files as unstage_files, git_commit as commit_files, get_git_log, get_git_branch, is_git_repo as check_is_git_repo, git_push as do_push, git_pull as do_pull, git_fetch as do_fetch, git_list_branches as list_branches, git_create_branch as create_branch, git_switch_branch as switch_branch, GitStatus, GitCommit};
use highlight::highlight_code as do_highlight;
use search::{search_in_directory as do_search, replace_in_files as do_replace, SearchResult, ReplaceResult};

use log::info;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::Emitter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone, Serialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub kind: String,
}

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

const BLOCKED_SYSTEM_PATHS: &[&str] = &[
    "/etc", "/proc", "/sys", "/boot", "/root", "/var/run", "/var/cache",
    "/usr/bin", "/usr/sbin", "/usr/lib",
    "C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)",
    "C:\\",
];

fn get_sandbox_root() -> PathBuf {
    dirs::home_dir()
        .or_else(|| dirs::config_dir())
        .unwrap_or_else(|| PathBuf::from("."))
}

fn validate_and_sandbox_path(user_path: &str) -> Result<PathBuf, String> {
    let sandbox_root = get_sandbox_root();
    let canonicalized_root = sandbox_root.canonicalize()
        .map_err(|e| format!("Failed to get sandbox root: {}", e))?;

    let resolved = sandbox_root.join(user_path).canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    if !resolved.starts_with(&canonicalized_root) {
        return Err(format!(
            "Path '{}' escapes sandbox (allowed: {:?})",
            user_path, canonicalized_root
        ));
    }

    let path_str = resolved.to_string_lossy().to_lowercase();
    for blocked in BLOCKED_SYSTEM_PATHS {
        if path_str.starts_with(&blocked.to_lowercase()) {
            return Err("Access to system directories is restricted".to_string());
        }
    }

    Ok(resolved)
}

fn validate_path(path: &str) -> Result<PathBuf, String> {
    if path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    validate_and_sandbox_path(path)
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum ReadFileResponse {
    Full { content: String },
    Chunked { content: String, offset: u64, total: u64, done: bool },
}

const CHUNK_SIZE: u64 = 1024 * 1024;

#[tauri::command]
async fn read_file(path: String, offset: Option<u64>, chunk_size: Option<u64>) -> Result<ReadFileResponse, String> {
    use tokio::fs::File;
    use tokio::io::{AsyncReadExt, AsyncSeekExt};

    info!("Reading file: {}", path);
    let validated = validate_path(&path)?;
    let metadata = tokio::fs::metadata(&validated)
        .await
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    if metadata.len() > MAX_FILE_SIZE && chunk_size.is_none() {
        return Err(format!("File too large (max {} bytes). Use chunked read.", MAX_FILE_SIZE));
    }
    if !metadata.is_file() {
        return Err("Path is not a file".to_string());
    }

    let file_size = metadata.len();

    if let Some(chunk) = chunk_size {
        let start = offset.unwrap_or(0);
        let size = chunk.min(file_size.saturating_sub(start));
        
        let mut file = File::open(&validated)
            .await
            .map_err(|e| format!("Failed to open file: {}", e))?;
        
        file.seek(tokio::io::SeekFrom::Start(start))
            .await
            .map_err(|e| format!("Failed to seek: {}", e))?;
        
        let mut buffer = vec![0u8; size as usize];
        let bytes_read = file.read(&mut buffer)
            .await
            .map_err(|e| format!("Failed to read: {}", e))?;
        
        buffer.truncate(bytes_read);
        let content = String::from_utf8_lossy(&buffer).to_string();
        
        return Ok(ReadFileResponse::Chunked {
            content,
            offset: start,
            total: file_size,
            done: start + bytes_read as u64 >= file_size,
        });
    }

    let content = tokio::fs::read_to_string(&validated)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(ReadFileResponse::Full { content })
}

#[tauri::command]
async fn write_file(path: String, content: String, append: Option<bool>) -> Result<(), String> {
    info!("Writing file: {}", path);
    let validated = validate_path(&path)?;
    if content.len() as u64 > MAX_FILE_SIZE {
        return Err(format!("Content too large (max {} bytes)", MAX_FILE_SIZE));
    }

    use tokio::io::AsyncWriteExt;

    if append.unwrap_or(false) {
        let mut file = tokio::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&validated)
            .await
            .map_err(|e| format!("Failed to open file: {}", e))?;
        file.write_all(content.as_bytes())
            .await
            .map_err(|e| format!("Failed to write: {}", e))?;
    } else {
        tokio::fs::write(&validated, content)
            .await
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
async fn load_settings() -> Result<commands::Settings, String> {
    commands::load_settings()
}

#[tauri::command]
async fn save_settings(settings: commands::Settings) -> Result<(), String> {
    commands::save_settings(settings)
}

#[tauri::command]
async fn highlight_code(code: String, lang: String) -> Result<String, String> {
    do_highlight(&code, &lang)
}

#[tauri::command]
async fn open_file_dialog() -> Result<Option<String>, String> {
    info!("Opening file dialog");
    Ok(None)
}

#[tauri::command]
async fn save_file_dialog(default_name: String) -> Result<Option<String>, String> {
    info!("Opening save dialog with default: {}", default_name);
    Ok(None)
}

const ALLOWED_EXECUTABLES: &[&str] = &[
    "ls", "cat", "echo", "pwd", "git", "npm", "node", "python", 
    "python3", "cargo", "grep", "head", "tail", "wc", "sort", "uniq",
    "cut", "tr", "sed", "awk", "curl", "wget", "find",
];

const DANGEROUS_ARGS: &[&str] = &[
    "-rf", "--force", "-rf/", "--force-recursive",
    "-f --", "--recursive", "-r", "--remove",
];

const BLOCKED_PATTERNS: &[&str] = &[
    "rm -rf /", "rm -rf ~", "mkfs", "dd if=", ":(){:|:&};:",
    "chmod -R 777 /", "/dev/sd", "mv /*", 
];

fn parse_command(input: &str) -> Result<Vec<String>, String> {
    shlex::split(input).ok_or_else(|| "Failed to parse command".to_string())
}

fn is_executable_allowed(executable: &str) -> bool {
    ALLOWED_EXECUTABLES.contains(&executable)
}

fn contains_dangerous_args(args: &[String]) -> bool {
    args.iter().any(|a| DANGEROUS_ARGS.contains(&a.as_str()))
}

fn contains_blocked_pattern(input: &str) -> bool {
    let lower = input.to_lowercase();
    BLOCKED_PATTERNS.iter().any(|p| lower.contains(&p.to_lowercase()))
}

#[tauri::command]
async fn execute_command(command: String) -> Result<String, String> {
    info!("Executing command: {}", command);
    if contains_blocked_pattern(&command) {
        return Err("Command blocked for security reasons".to_string());
    }
    let parts = parse_command(&command)?;
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }
    let executable = &parts[0];
    let args: Vec<&str> = parts[1..].iter().map(|s| s.as_str()).collect();
    if !is_executable_allowed(executable) {
        return Err(format!(
            "Executable '{}' not allowed. Allowed: {}",
            executable,
            ALLOWED_EXECUTABLES.join(", ")
        ));
    }
    if contains_dangerous_args(&parts) {
        return Err("Command contains dangerous arguments".to_string());
    }
    let output = std::process::Command::new(executable)
        .args(&args)
        .output()
        .map_err(|e| format!("Execution failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Command failed:\n{}\n{}", stdout, stderr))
    }
}

#[derive(Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<DirEntry>, String> {
    info!("Reading directory: {}", path);
    let entries = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    let mut result: Vec<DirEntry> = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let path_buf = entry.path();
            let name = path_buf.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();
            if !name.starts_with('.') {
                result.push(DirEntry {
                    name,
                    path: path_buf.to_string_lossy().to_string(),
                    is_directory: path_buf.is_dir(),
                });
            }
        }
    }
    result.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    Ok(result)
}

#[tauri::command]
async fn git_status(repo_path: String) -> Result<GitStatus, String> {
    get_git_status(&repo_path)
}

#[tauri::command]
async fn git_diff(repo_path: String, file_path: String) -> Result<String, String> {
    get_git_diff(&repo_path, &file_path)
}

#[tauri::command]
async fn git_stage_files(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    stage_files(&repo_path, paths)
}

#[tauri::command]
async fn git_unstage_files(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    unstage_files(&repo_path, paths)
}

#[tauri::command]
async fn git_commit(repo_path: String, message: String) -> Result<String, String> {
    commit_files(&repo_path, &message)
}

#[tauri::command]
async fn git_log(repo_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    get_git_log(&repo_path, limit)
}

#[tauri::command]
async fn git_branch(repo_path: String) -> Result<String, String> {
    get_git_branch(&repo_path)
}

#[tauri::command]
async fn is_git_repo(path: String) -> Result<bool, String> {
    Ok(check_is_git_repo(&path))
}

#[tauri::command]
async fn git_push(repo_path: String) -> Result<String, String> {
    do_push(&repo_path)
}

#[tauri::command]
async fn git_pull(repo_path: String) -> Result<String, String> {
    do_pull(&repo_path)
}

#[tauri::command]
async fn git_fetch(repo_path: String) -> Result<String, String> {
    do_fetch(&repo_path)
}

#[tauri::command]
async fn git_list_branches(repo_path: String) -> Result<Vec<git::GitBranch>, String> {
    list_branches(&repo_path)
}

#[tauri::command]
async fn git_create_branch(repo_path: String, branch_name: String) -> Result<String, String> {
    create_branch(&repo_path, &branch_name)
}

#[tauri::command]
async fn git_switch_branch(repo_path: String, branch_name: String) -> Result<String, String> {
    switch_branch(&repo_path, &branch_name)
}

#[tauri::command]
async fn search_in_directory(
    dir_path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    regex: bool,
    file_pattern: Option<String>,
) -> Result<Vec<SearchResult>, String> {
    do_search(&dir_path, &query, case_sensitive, whole_word, regex, file_pattern.as_deref())
}

#[tauri::command]
async fn replace_in_files(
    dir_path: String,
    find: String,
    replace: String,
    case_sensitive: bool,
    whole_word: bool,
    regex: bool,
) -> Result<Vec<ReplaceResult>, String> {
    do_replace(&dir_path, &find, &replace, case_sensitive, whole_word, regex)
}

#[tauri::command]
async fn watch_file(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    let path_clone = path.clone();
    let handle_clone = app_handle.clone();
    std::thread::spawn(move || {
        let (tx, rx) = channel();
        let mut watcher: RecommendedWatcher = match RecommendedWatcher::new(
            move |res: Result<notify::Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            notify::Config::default(),
        ) {
            Ok(w) => w,
            Err(e) => {
                log::error!("Failed to create watcher: {}", e);
                return;
            }
        };
        if let Err(e) = watcher.watch(std::path::Path::new(&path_clone), RecursiveMode::NonRecursive) {
            log::error!("Failed to watch path: {}", e);
            return;
        }
        loop {
            match rx.recv_timeout(Duration::from_secs(2)) {
                Ok(event) => {
                    let kind_str = match event.kind {
                        EventKind::Modify(_) => "modified",
                        EventKind::Create(_) => "created",
                        EventKind::Remove(_) => "removed",
                        _ => continue,
                    };
                    for file_path in event.paths {
                        let file_event = FileChangeEvent {
                            path: file_path.to_string_lossy().to_string(),
                            kind: kind_str.to_string(),
                        };
                        let _ = handle_clone.emit("file-changed", file_event);
                    }
                }
                Err(_) => {
                    continue;
                }
            }
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "r_code=info,tauri=warn".into()))
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stderr).json())
        .init();
    info!("Starting R-Code application");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| {
            info!("Application setup complete");
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            load_settings,
            save_settings,
            highlight_code,
            open_file_dialog,
            save_file_dialog,
            execute_command,
            read_directory,
            git_status,
            git_diff,
            git_stage_files,
            git_unstage_files,
            git_commit,
            git_log,
            git_branch,
            is_git_repo,
            git_push,
            git_pull,
            git_fetch,
            git_list_branches,
            git_create_branch,
            git_switch_branch,
            search_in_directory,
            replace_in_files,
            watch_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
