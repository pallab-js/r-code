use log::info;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

const GIT_DEFAULT_TIMEOUT_SECS: u64 = 30;

fn is_git_available() -> bool {
    Command::new("git")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub staged: Vec<GitFile>,
    pub modified: Vec<GitFile>,
    pub untracked: Vec<GitFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFile {
    pub path: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
}

fn parse_git_error(stderr: &str, cmd: &str) -> String {
    if stderr.contains("not a git repository") || stderr.contains("fatal: not a repo") {
        "Not a Git repository".to_string()
    } else if stderr.contains("Authentication failed") || stderr.contains("credential-store") {
        "Git authentication failed".to_string()
    } else if stderr.contains("Push rejected") || stderr.contains("rejected") {
        "Push rejected - check remote changes".to_string()
    } else if stderr.contains("conflict") || stderr.contains("CONFLICT") {
        "Merge conflict detected".to_string()
    } else if stderr.contains("detached") {
        "Detached HEAD state".to_string()
    } else if stderr.is_empty() {
        format!("Git command '{}' failed", cmd)
    } else {
        stderr.lines().next().unwrap_or(cmd).to_string()
    }
}

fn run_git_command_with_timeout(
    repo_path: &str,
    args: &[&str],
    timeout_secs: u64,
) -> Result<String, String> {
    let (tx, rx) = mpsc::channel();
    let start = Instant::now();
    let repo = repo_path.to_string();
    let cmd_args: Vec<String> = args.iter().map(|s| s.to_string()).collect();

    thread::spawn(move || {
        let output = Command::new("git")
            .args(cmd_args.iter().map(|s| s.as_str()))
            .current_dir(&repo)
            .output();

        let _ = tx.send(output);
    });

    let remaining = timeout_secs.saturating_sub(start.elapsed().as_secs());
    if remaining == 0 {
        return Err(format!("Git command timed out before execution"));
    }

    match rx.recv_timeout(Duration::from_secs(remaining)) {
        Ok(result) => {
            let output = result.map_err(|e| format!("Git spawn error: {}", e))?;
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                Err(parse_git_error(
                    &String::from_utf8_lossy(&output.stderr),
                    &args.join(" "),
                ))
            }
        }
        Err(_) => Err(format!(
            "Git command timed out after {}s",
            timeout_secs
        )),
    }
}

fn run_git_command(
    repo_path: &str,
    args: &[&str],
    timeout_secs: u64,
) -> Result<String, String> {
    run_git_command_with_timeout(repo_path, args, timeout_secs)
}

pub fn get_git_status(repo_path: &str) -> Result<GitStatus, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }

    info!("Getting git status for: {}", repo_path);

    let stdout = run_git_command(repo_path, &["status", "--porcelain=v1"], GIT_DEFAULT_TIMEOUT_SECS)?;

    let mut staged: Vec<GitFile> = Vec::new();
    let mut modified: Vec<GitFile> = Vec::new();
    let mut untracked: Vec<GitFile> = Vec::new();

    for line in stdout.lines() {
        if line.len() < 3 {
            continue;
        }
        let index_status = line.chars().next().unwrap_or(' ');
        let worktree_status = line.chars().nth(1).unwrap_or(' ');
        let path = line[3..].to_string();

        if index_status == '?' && worktree_status == '?' {
            untracked.push(GitFile {
                path: path.clone(),
                status: "untracked".to_string(),
            });
        } else if index_status != ' ' && index_status != '?' {
            staged.push(GitFile {
                path: path.clone(),
                status: "staged".to_string(),
            });
        }
        if worktree_status != ' ' && worktree_status != '?' {
            if modified.iter().find(|f| f.path == path).is_none() {
                modified.push(GitFile {
                    path,
                    status: "modified".to_string(),
                });
            }
        }
    }

    let branch = get_git_branch(repo_path).unwrap_or_else(|_| "unknown".to_string());

    Ok(GitStatus {
        branch,
        staged,
        modified,
        untracked,
    })
}

pub fn get_git_branch(repo_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    let stdout = run_git_command(
        repo_path,
        &["rev-parse", "--abbrev-ref", "HEAD"],
        GIT_DEFAULT_TIMEOUT_SECS,
    )?;
    Ok(stdout.trim().to_string())
}

pub fn get_git_diff(repo_path: &str, file_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Getting git diff for: {}", file_path);
    run_git_command(repo_path, &["diff", file_path], GIT_DEFAULT_TIMEOUT_SECS)
}

pub fn get_git_staged_diff(repo_path: &str, file_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Getting staged diff for: {}", file_path);
    run_git_command(repo_path, &["diff", "--cached", file_path], GIT_DEFAULT_TIMEOUT_SECS)
}

pub fn git_stage_files(repo_path: &str, paths: Vec<String>) -> Result<(), String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Staging files: {:?}", paths);

    for path in paths {
        run_git_command(repo_path, &["add", &path], GIT_DEFAULT_TIMEOUT_SECS)?;
    }
    Ok(())
}

pub fn git_unstage_files(repo_path: &str, paths: Vec<String>) -> Result<(), String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Unstaging files: {:?}", paths);

    for path in paths {
        run_git_command(
            repo_path,
            &["reset", "HEAD", &path],
            GIT_DEFAULT_TIMEOUT_SECS,
        )?;
    }
    Ok(())
}

pub fn git_commit(repo_path: &str, message: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Creating commit: {}", message);
    run_git_command(repo_path, &["commit", "-m", message], GIT_DEFAULT_TIMEOUT_SECS)
}

pub fn get_git_log(repo_path: &str, limit: usize) -> Result<Vec<GitCommit>, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Getting git log (limit: {})", limit);

    let stdout = run_git_command(
        repo_path,
        &[
            "log",
            "--format=%H|%h|%s|%an|%ad",
            &format!("-{}", limit),
            "--date=short",
        ],
        GIT_DEFAULT_TIMEOUT_SECS,
    )?;

    let mut commits: Vec<GitCommit> = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 5 {
            commits.push(GitCommit {
                hash: parts[0].to_string(),
                short_hash: parts[1].to_string(),
                message: parts[2].to_string(),
                author: parts[3].to_string(),
                date: parts[4].to_string(),
            });
        }
    }

    Ok(commits)
}

pub fn is_git_repo(path: &str) -> bool {
    if !is_git_available() {
        return false;
    }
    Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .current_dir(path)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn git_push(repo_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Pushing to remote");
    run_git_command(repo_path, &["push"], GIT_DEFAULT_TIMEOUT_SECS * 2)
}

pub fn git_pull(repo_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Pulling from remote");
    run_git_command(repo_path, &["pull"], GIT_DEFAULT_TIMEOUT_SECS * 2)
}

pub fn git_fetch(repo_path: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Fetching from remote");
    run_git_command(repo_path, &["fetch", "--all"], GIT_DEFAULT_TIMEOUT_SECS * 2)
}

pub fn git_list_branches(repo_path: &str) -> Result<Vec<GitBranch>, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Listing branches");
    let stdout = run_git_command(repo_path, &["branch", "-a"], GIT_DEFAULT_TIMEOUT_SECS)?;
    let branches: Vec<GitBranch> = stdout
        .lines()
        .map(|line| GitBranch {
            name: line.trim().replace("* ", "").to_string(),
        })
        .collect();
    Ok(branches)
}

pub fn git_create_branch(repo_path: &str, branch_name: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Creating branch: {}", branch_name);
    run_git_command(
        repo_path,
        &["checkout", "-b", branch_name],
        GIT_DEFAULT_TIMEOUT_SECS,
    )
}

pub fn git_switch_branch(repo_path: &str, branch_name: &str) -> Result<String, String> {
    if !is_git_available() {
        return Err("Git is not installed or not in PATH".to_string());
    }
    info!("Switching to branch: {}", branch_name);
    run_git_command(repo_path, &[branch_name], GIT_DEFAULT_TIMEOUT_SECS)
}