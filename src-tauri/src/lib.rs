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
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::Emitter;

#[derive(Clone, Serialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub kind: String,
}

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

fn validate_path(path: &str) -> Result<(), String> {
    let normalized = std::path::Path::new(path);
    if normalized.components().any(|c| std::path::Component::ParentDir == c) {
        return Err("Path traversal not allowed".to_string());
    }
    if path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    Ok(())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    info!("Reading file: {}", path);
    validate_path(&path)?;
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    if metadata.len() > MAX_FILE_SIZE {
        return Err(format!("File too large (max {} bytes)", MAX_FILE_SIZE));
    }
    if !metadata.is_file() {
        return Err("Path is not a file".to_string());
    }
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    info!("Writing file: {}", path);
    validate_path(&path)?;
    if content.len() as u64 > MAX_FILE_SIZE {
        return Err(format!("Content too large (max {} bytes)", MAX_FILE_SIZE));
    }
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
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

const ALLOWED_COMMANDS: &[&str] = &[
    "ls", "cat", "echo", "pwd", "cd", "git", "npm", "node", "python", 
    "python3", "cargo", "rustc", "make", "grep", "find", "head", "tail",
    "wc", "sort", "uniq", "cut", "tr", "sed", "awk", "curl", "wget",
];

const BLOCKED_PATTERNS: &[&str] = &[
    "rm -rf /", "rm -rf ~", "mkfs", "dd if=", ":(){:|:&};:",
    "chmod -R 777 /", ">", "/dev/sd", "mv /*", 
];

fn is_command_allowed(cmd: &str) -> bool {
    let first_word = cmd.split_whitespace().next().unwrap_or("");
    ALLOWED_COMMANDS.contains(&first_word)
}

fn contains_blocked_pattern(cmd: &str) -> bool {
    let lower = cmd.to_lowercase();
    BLOCKED_PATTERNS.iter().any(|p| lower.contains(&p.to_lowercase()))
}

#[tauri::command]
async fn execute_command(command: String) -> Result<String, String> {
    info!("Executing command: {}", command);
    if contains_blocked_pattern(&command) {
        return Err("Command blocked for security reasons".to_string());
    }
    if !is_command_allowed(&command) {
        return Err(format!(
            "Command '{}' is not allowed. Allowed commands: {}",
            command.split_whitespace().next().unwrap_or(""),
            ALLOWED_COMMANDS.join(", ")
        ));
    }
    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(&command)
        .output()
        .map_err(|e| format!("Command failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if !stderr.is_empty() {
        Ok(format!("{}\n{}", stdout, stderr))
    } else {
        Ok(stdout)
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
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
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
