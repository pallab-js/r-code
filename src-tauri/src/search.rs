use log::info;
use serde::{Deserialize, Serialize};
use std::process::Command;

fn validate_search_path(dir_path: &str) -> Result<(), String> {
    let forbidden = ["/etc", "/sys", "/proc", "/boot", "/root"];
    let normalized = std::path::Path::new(dir_path);

    for part in forbidden.iter() {
        if normalized.starts_with(part) {
            return Err(format!("Searching in {} is not allowed", part));
        }
    }

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub file_path: String,
    pub matches: Vec<SearchMatch>,
    pub total_matches: usize,
}

pub fn search_in_directory(
    dir_path: &str,
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
    regex: bool,
    _file_pattern: Option<&str>,
) -> Result<Vec<SearchResult>, String> {
    info!("Searching in {} for: {}", dir_path, query);

    validate_search_path(dir_path)?;

    let mut args = vec!["grep".to_string(), "-n".to_string()];

    if !case_sensitive && !regex {
        args.push("-i".to_string());
    }

    if whole_word {
        args.push("-w".to_string());
    }

    if regex {
        args.push("-E".to_string());
    }

    args.push("--".to_string());
    args.push(".".to_string());
    args.push(query.to_string());

    let output = Command::new("grep")
        .args(&args)
        .current_dir(dir_path)
        .output()
        .map_err(|e| format!("Search failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut results: Vec<SearchResult> = Vec::new();
    let mut current_file: Option<String> = None;
    let mut current_result: Option<SearchResult> = None;

    for line in stdout.lines() {
        if let Some(colon_pos) = line.find(':') {
            let file_path = line[..colon_pos].to_string();
            let rest = &line[colon_pos + 1..];

            if let Some(dot_pos) = rest.find(':') {
                if let Ok(line_number) = rest[..dot_pos].parse::<usize>() {
                    let line_content = rest[dot_pos + 1..].to_string();

                    let match_start = line_content.find(query).unwrap_or(0);
                    let match_end = match_start + query.len();

                    let file_path_for_match = file_path.clone();

                    if current_file.as_ref() != Some(&file_path) {
                        if let Some(result) = current_result.take() {
                            results.push(result);
                        }
                        current_file = Some(file_path.clone());
                        current_result = Some(SearchResult {
                            file_path,
                            matches: Vec::new(),
                            total_matches: 0,
                        });
                    }

                    if let Some(ref mut result) = current_result {
                        result.matches.push(SearchMatch {
                            file_path: file_path_for_match,
                            line_number,
                            line_content,
                            match_start,
                            match_end,
                        });
                        result.total_matches += 1;
                    }
                }
            }
        }
    }

    if let Some(result) = current_result {
        results.push(result);
    }

    Ok(results)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplaceResult {
    pub file_path: String,
    pub replacements: usize,
}

pub fn replace_in_files(
    dir_path: &str,
    find: &str,
    replace: &str,
    case_sensitive: bool,
    whole_word: bool,
    regex: bool,
) -> Result<Vec<ReplaceResult>, String> {
    info!("Replacing in {}: {} -> {}", dir_path, find, replace);

    validate_search_path(dir_path)?;

    let mut results: Vec<ReplaceResult> = Vec::new();

    let search_results =
        search_in_directory(dir_path, find, case_sensitive, whole_word, regex, None)?;

    for result in search_results {
        let replacements = result.total_matches;

        if replacements > 0 {
            let pattern = if case_sensitive {
                format!(
                    "s/{}/{}/g",
                    find.replace('/', "\\/").replace('&', "\\&"),
                    replace.replace('/', "\\/").replace('&', "\\&")
                )
            } else {
                format!(
                    "s/{}/{}/gI",
                    find.replace('/', "\\/").replace('&', "\\&"),
                    replace.replace('/', "\\/").replace('&', "\\&")
                )
            };

            let cmd = format!("sed -i '{}' {}", pattern, result.file_path);

            let output = Command::new("bash")
                .args(["-c", &cmd])
                .current_dir(dir_path)
                .output()
                .map_err(|e| format!("Replace failed: {}", e))?;

            if output.status.success() {
                results.push(ReplaceResult {
                    file_path: result.file_path,
                    replacements,
                });
            }
        }
    }

    Ok(results)
}
