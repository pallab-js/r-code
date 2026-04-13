use log::info;
use serde::{Deserialize, Serialize};
use std::process::Command;

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

pub fn get_git_status(repo_path: &str) -> Result<GitStatus, String> {
    info!("Getting git status for: {}", repo_path);

    let output = Command::new("git")
        .args(["status", "--porcelain=v1"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git command failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
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
            let path_for_modified = path.clone();
            if modified
                .iter()
                .find(|f| f.path == path_for_modified)
                .is_none()
            {
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
    let output = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git command failed: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn get_git_diff(repo_path: &str, file_path: &str) -> Result<String, String> {
    info!("Getting git diff for: {}", file_path);

    let output = Command::new("git")
        .args(["diff", file_path])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git diff failed: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn get_git_staged_diff(repo_path: &str, file_path: &str) -> Result<String, String> {
    info!("Getting staged diff for: {}", file_path);

    let output = Command::new("git")
        .args(["diff", "--cached", file_path])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git staged diff failed: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn git_stage_files(repo_path: &str, paths: Vec<String>) -> Result<(), String> {
    info!("Staging files: {:?}", paths);

    for path in paths {
        Command::new("git")
            .args(["add", &path])
            .current_dir(repo_path)
            .output()
            .map_err(|e| format!("Git add failed: {}", e))?;
    }

    Ok(())
}

pub fn git_unstage_files(repo_path: &str, paths: Vec<String>) -> Result<(), String> {
    info!("Unstaging files: {:?}", paths);

    for path in paths {
        Command::new("git")
            .args(["reset", "HEAD", &path])
            .current_dir(repo_path)
            .output()
            .map_err(|e| format!("Git reset failed: {}", e))?;
    }

    Ok(())
}

pub fn git_commit(repo_path: &str, message: &str) -> Result<String, String> {
    info!("Creating commit: {}", message);

    let output = Command::new("git")
        .args(["commit", "-m", message])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git commit failed: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

pub fn get_git_log(repo_path: &str, limit: usize) -> Result<Vec<GitCommit>, String> {
    info!("Getting git log (limit: {})", limit);

    let output = Command::new("git")
        .args([
            "log",
            "--format=%H|%h|%s|%an|%ad",
            &format!("-{}", limit),
            "--date=short",
        ])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git log failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
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
    Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .current_dir(path)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn git_push(repo_path: &str) -> Result<String, String> {
    info!("Pushing to remote");
    let output = Command::new("git")
        .args(["push"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git push failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn git_pull(repo_path: &str) -> Result<String, String> {
    info!("Pulling from remote");
    let output = Command::new("git")
        .args(["pull"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git pull failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn git_fetch(repo_path: &str) -> Result<String, String> {
    info!("Fetching from remote");
    let output = Command::new("git")
        .args(["fetch", "--all"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git fetch failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
}

pub fn git_list_branches(repo_path: &str) -> Result<Vec<GitBranch>, String> {
    info!("Listing branches");
    let output = Command::new("git")
        .args(["branch", "-a"])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git branch list failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let branches: Vec<GitBranch> = stdout
        .lines()
        .map(|line| GitBranch {
            name: line.trim().replace("* ", "").to_string(),
        })
        .collect();
    Ok(branches)
}

pub fn git_create_branch(repo_path: &str, branch_name: &str) -> Result<String, String> {
    info!("Creating branch: {}", branch_name);
    let output = Command::new("git")
        .args(["checkout", "-b", branch_name])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git branch create failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn git_switch_branch(repo_path: &str, branch_name: &str) -> Result<String, String> {
    info!("Switching to branch: {}", branch_name);
    let output = Command::new("git")
        .args(["checkout", branch_name])
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Git switch branch failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
