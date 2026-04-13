#[cfg(test)]
mod tests {
    use crate::git::GitFile;

    #[test]
    fn test_git_file_creation() {
        let file = GitFile {
            path: "test.rs".to_string(),
            status: "modified".to_string(),
        };

        assert_eq!(file.path, "test.rs");
        assert_eq!(file.status, "modified");
    }

    #[test]
    fn test_git_file_clone() {
        let file = GitFile {
            path: "main.rs".to_string(),
            status: "staged".to_string(),
        };

        let cloned = file.clone();

        assert_eq!(cloned.path, file.path);
        assert_eq!(cloned.status, file.status);
    }
}

#[cfg(test)]
mod highlight_tests {
    #[test]
    fn test_highlight_json() {
        let code = r#"{"key": "value"}"#;
        let lang = "json";

        let result = crate::highlight::highlight_code(code, lang);

        assert!(result.is_ok());
    }

    #[test]
    fn test_highlight_markdown() {
        let code = "# Hello World";
        let lang = "markdown";

        let result = crate::highlight::highlight_code(code, lang);

        assert!(result.is_ok());
    }

    #[test]
    fn test_highlight_unknown_language() {
        let code = "some random text";
        let lang = "unknown";

        let result = crate::highlight::highlight_code(code, lang);

        assert!(result.is_ok());
    }
}

#[cfg(test)]
mod settings_tests {
    use crate::commands::Settings;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();

        assert_eq!(settings.font_size, 14);
        assert_eq!(settings.theme, "light");
        assert_eq!(settings.font_family, "berkeleyMono");
        assert_eq!(settings.tab_size, 2);
    }

    #[test]
    fn test_settings_serialization() {
        let settings = Settings {
            font_size: 16,
            theme: "dark".to_string(),
            font_family: "monospace".to_string(),
            tab_size: 4,
        };

        let json = serde_json::to_string(&settings);
        assert!(json.is_ok());

        let deserialized: Settings = serde_json::from_str(&json.unwrap()).unwrap();
        assert_eq!(deserialized.font_size, 16);
        assert_eq!(deserialized.theme, "dark");
    }
}
