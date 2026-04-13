use log::info;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FileError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Path not allowed: {0}")]
    PathNotAllowed(String),
}

impl Serialize for FileError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub fn read_file(path: String) -> Result<String, FileError> {
    info!("Reading file: {}", path);
    let content = fs::read_to_string(&path)?;
    Ok(content)
}

pub fn write_file(path: String, content: String) -> Result<(), FileError> {
    info!("Writing file: {}", path);
    fs::write(&path, content)?;
    Ok(())
}

pub fn get_config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("r-code")
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub font_size: u32,
    pub theme: String,
    #[serde(rename = "fontFamily")]
    pub font_family: String,
    pub tab_size: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            font_size: 14,
            theme: "light".to_string(),
            font_family: "berkeleyMono".to_string(),
            tab_size: 2,
        }
    }
}

pub fn load_settings() -> Result<Settings, String> {
    let config_path = get_config_dir().join("settings.json");
    info!("Loading settings from: {:?}", config_path);

    if !config_path.exists() {
        info!("Settings file not found, using defaults");
        return Ok(Settings::default());
    }

    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: Settings =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))?;

    Ok(settings)
}

pub fn save_settings(settings: Settings) -> Result<(), String> {
    let config_dir = get_config_dir();
    let config_path = config_dir.join("settings.json");

    info!("Saving settings to: {:?}", config_path);

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&config_path, content).map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}
