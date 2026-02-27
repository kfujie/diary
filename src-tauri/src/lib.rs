use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

const DIARY_TEMPLATE: &str = r#"
Diary Entry for {DATE}

Beginning:

End:

Location: {LOCATION}
"#;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiaryEntry {
    pub year: String,
    pub month: String,
    pub day: String,
    pub content: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocationInfo {
    pub city: Option<String>,
    pub region: Option<String>,
    pub country: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub path: String,
    pub date: String,
    pub snippet: String,
}

fn get_diary_root() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join("Documents")
        .join("Diary")
}

fn get_diary_path(year: &str, month: &str, day: &str) -> PathBuf {
    get_diary_root()
        .join(year)
        .join(month)
        .join(format!("{}-{}-{}.txt", year, month, day))
}

#[tauri::command]
fn get_diary_root_path() -> String {
    get_diary_root().to_string_lossy().to_string()
}

#[tauri::command]
fn read_entry(year: &str, month: &str, day: &str) -> Result<DiaryEntry, String> {
    let path = get_diary_path(year, month, day);

    if !path.exists() {
        return Err("Entry does not exist".to_string());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read entry: {}", e))?;

    Ok(DiaryEntry {
        year: year.to_string(),
        month: month.to_string(),
        day: day.to_string(),
        content,
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn write_entry(year: &str, month: &str, day: &str, content: &str) -> Result<String, String> {
    let path = get_diary_path(year, month, day);

    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write entry: {}", e))?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn create_entry_with_template(year: &str, month: &str, day: &str, location: &str) -> Result<DiaryEntry, String> {
    let path = get_diary_path(year, month, day);

    // If entry already exists, just return it
    if path.exists() {
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read entry: {}", e))?;
        return Ok(DiaryEntry {
            year: year.to_string(),
            month: month.to_string(),
            day: day.to_string(),
            content,
            path: path.to_string_lossy().to_string(),
        });
    }

    // Create parent directories
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    // Generate content from template
    let date_str = format!("{}-{}-{}", year, month, day);
    let content = DIARY_TEMPLATE
        .replace("{DATE}", &date_str)
        .replace("{LOCATION}", location);

    fs::write(&path, &content)
        .map_err(|e| format!("Failed to write entry: {}", e))?;

    Ok(DiaryEntry {
        year: year.to_string(),
        month: month.to_string(),
        day: day.to_string(),
        content,
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn entry_exists(year: &str, month: &str, day: &str) -> bool {
    get_diary_path(year, month, day).exists()
}

#[tauri::command]
fn get_past_entries(month: &str, day: &str, current_year: i32) -> Vec<DiaryEntry> {
    let mut entries = Vec::new();

    // Look back from the year before current_year down to 2019
    for past_year in (2019..current_year).rev() {
        let year_str = past_year.to_string();
        let path = get_diary_path(&year_str, month, day);

        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                entries.push(DiaryEntry {
                    year: year_str,
                    month: month.to_string(),
                    day: day.to_string(),
                    content,
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }

    entries
}

#[tauri::command]
fn search_entries(keyword: &str) -> Vec<SearchResult> {
    let mut results = Vec::new();
    let keyword_lower = keyword.to_lowercase();
    let diary_root = get_diary_root();

    if !diary_root.exists() {
        return results;
    }

    for entry in WalkDir::new(&diary_root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "txt"))
    {
        if let Ok(content) = fs::read_to_string(entry.path()) {
            if content.to_lowercase().contains(&keyword_lower) {
                // Extract filename to get date
                let filename = entry.file_name().to_string_lossy().to_string();
                let date = filename.trim_end_matches(".txt").to_string();

                // Find the line containing the keyword for snippet
                let snippet = content
                    .lines()
                    .find(|line| line.to_lowercase().contains(&keyword_lower))
                    .unwrap_or("")
                    .chars()
                    .take(100)
                    .collect::<String>();

                results.push(SearchResult {
                    path: entry.path().to_string_lossy().to_string(),
                    date,
                    snippet,
                });
            }
        }
    }

    // Sort by date descending (most recent first)
    results.sort_by(|a, b| b.date.cmp(&a.date));
    results
}

#[tauri::command]
fn get_entries_for_month(year: &str, month: &str) -> Vec<String> {
    let mut days = Vec::new();
    let folder_path = get_diary_root().join(year).join(month);

    if !folder_path.exists() {
        return days;
    }

    if let Ok(entries) = fs::read_dir(&folder_path) {
        for entry in entries.flatten() {
            let filename = entry.file_name().to_string_lossy().to_string();
            if filename.ends_with(".txt") {
                // Extract day from filename like "2024-02-26.txt" -> "26"
                if let Some(day) = filename
                    .trim_end_matches(".txt")
                    .split('-')
                    .last()
                {
                    days.push(day.to_string());
                }
            }
        }
    }

    days.sort();
    days
}

#[tauri::command]
fn get_all_entry_dates() -> Vec<String> {
    let mut dates = Vec::new();
    let diary_root = get_diary_root();

    if !diary_root.exists() {
        return dates;
    }

    for entry in WalkDir::new(&diary_root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "txt"))
    {
        let filename = entry.file_name().to_string_lossy().to_string();
        let date = filename.trim_end_matches(".txt").to_string();
        // Validate date format YYYY-MM-DD
        if NaiveDate::parse_from_str(&date, "%Y-%m-%d").is_ok() {
            dates.push(date);
        }
    }

    dates.sort();
    dates.reverse();
    dates
}

#[tauri::command]
async fn fetch_location() -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("https://ipinfo.io/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch location: {}", e))?;

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse location: {}", e))?;

    let city = data.get("city").and_then(|v| v.as_str()).unwrap_or("Unknown City");
    let region = data.get("region").and_then(|v| v.as_str()).unwrap_or("Unknown Region");
    let country = data.get("country").and_then(|v| v.as_str()).unwrap_or("Unknown Country");

    Ok(format!("{}, {}, {}", city, region, country))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_diary_root_path,
            read_entry,
            write_entry,
            create_entry_with_template,
            entry_exists,
            get_past_entries,
            search_entries,
            get_entries_for_month,
            get_all_entry_dates,
            fetch_location
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
