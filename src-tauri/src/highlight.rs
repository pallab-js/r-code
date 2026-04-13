use log::info;
use syntect::highlighting::ThemeSet;
use syntect::parsing::SyntaxSet;

pub fn highlight_code(code: &str, lang: &str) -> Result<String, String> {
    info!("Highlighting code for language: {}", lang);

    let syntax_set = SyntaxSet::load_defaults_newlines();

    let syntax = match lang {
        "json" => syntax_set.find_syntax_by_extension("json"),
        "markdown" | "md" => syntax_set.find_syntax_by_extension("md"),
        "javascript" | "js" | "jsx" => syntax_set.find_syntax_by_extension("js"),
        "typescript" | "ts" | "tsx" => syntax_set.find_syntax_by_extension("ts"),
        "rust" | "rs" => syntax_set.find_syntax_by_extension("rs"),
        "python" | "py" | "pyw" => syntax_set.find_syntax_by_extension("py"),
        "html" => syntax_set.find_syntax_by_extension("html"),
        "css" => syntax_set.find_syntax_by_extension("css"),
        "go" | "golang" => syntax_set.find_syntax_by_extension("go"),
        "ruby" | "rb" => syntax_set.find_syntax_by_extension("rb"),
        "java" => syntax_set.find_syntax_by_extension("java"),
        "c" | "h" => syntax_set.find_syntax_by_extension("c"),
        "cpp" | "cc" | "cxx" | "hpp" => syntax_set.find_syntax_by_extension("cpp"),
        "toml" => syntax_set.find_syntax_by_extension("toml"),
        "yaml" | "yml" => syntax_set.find_syntax_by_extension("yaml"),
        "xml" => syntax_set.find_syntax_by_extension("xml"),
        "sql" => syntax_set.find_syntax_by_extension("sql"),
        "sh" | "bash" | "zsh" => syntax_set.find_syntax_by_extension("sh"),
        _ => None,
    };

    let syntax = syntax.unwrap_or_else(|| syntax_set.find_syntax_plain_text());

    let theme_set = ThemeSet::load_defaults();
    let theme = theme_set
        .themes
        .get("base16-ocean.dark")
        .or_else(|| theme_set.themes.values().next())
        .ok_or("No theme found")?;

    let highlighted = syntect::html::highlighted_html_for_string(code, &syntax_set, syntax, theme)
        .map_err(|e| format!("Highlight failed: {}", e))?;

    Ok(highlighted)
}
