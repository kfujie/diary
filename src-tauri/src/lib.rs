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

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    diary_root: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self { diary_root: None }
    }
}

fn get_settings_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().expect("Could not find home directory").join(".config"))
        .join("diary-app")
        .join("settings.json")
}

fn load_settings() -> AppSettings {
    let path = get_settings_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

fn default_diary_root() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join("Documents")
        .join("Diary")
}

fn get_diary_root() -> PathBuf {
    let settings = load_settings();
    match settings.diary_root {
        Some(ref path) if !path.is_empty() => PathBuf::from(path),
        _ => default_diary_root(),
    }
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
fn get_storage_path() -> String {
    get_diary_root().to_string_lossy().to_string()
}

#[tauri::command]
fn set_storage_path(path: &str) -> Result<String, String> {
    let path_buf = PathBuf::from(path);

    // Verify the path exists or can be created
    if !path_buf.exists() {
        fs::create_dir_all(&path_buf)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let mut settings = load_settings();
    settings.diary_root = Some(path.to_string());
    save_settings(&settings)?;

    Ok(path.to_string())
}

#[tauri::command]
fn reset_storage_path() -> Result<String, String> {
    let mut settings = load_settings();
    settings.diary_root = None;
    save_settings(&settings)?;
    Ok(default_diary_root().to_string_lossy().to_string())
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
async fn reverse_geocode(lat: f64, lon: f64) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!(
        "https://nominatim.openstreetmap.org/reverse?format=json&lat={}&lon={}&zoom=18&addressdetails=1",
        lat, lon
    );

    let response = client
        .get(&url)
        .header("User-Agent", "DiaryApp/0.1")
        .send()
        .await
        .map_err(|e| format!("Reverse geocode request failed: {}", e))?;

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse geocode response: {}", e))?;

    if let Some(address) = data.get("address") {
        let parts: Vec<&str> = [
            address.get("road").and_then(|v| v.as_str()),
            address.get("neighbourhood").and_then(|v| v.as_str()),
            address.get("suburb").and_then(|v| v.as_str())
                .or_else(|| address.get("city_district").and_then(|v| v.as_str())),
            address.get("city").and_then(|v| v.as_str())
                .or_else(|| address.get("town").and_then(|v| v.as_str()))
                .or_else(|| address.get("village").and_then(|v| v.as_str())),
            address.get("state").and_then(|v| v.as_str())
                .or_else(|| address.get("province").and_then(|v| v.as_str())),
            address.get("country").and_then(|v| v.as_str()),
        ]
        .into_iter()
        .flatten()
        .collect();

        if !parts.is_empty() {
            return Ok(parts.join(", "));
        }
    }

    // Fall back to display_name if address parsing fails
    if let Some(display) = data.get("display_name").and_then(|v| v.as_str()) {
        return Ok(display.to_string());
    }

    Err("Could not determine address from coordinates".to_string())
}

#[tauri::command]
async fn fetch_location() -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let mut last_error = String::from("Unknown error");

    for attempt in 0..3 {
        if attempt > 0 {
            tokio::time::sleep(std::time::Duration::from_millis(500 * attempt as u64)).await;
        }

        match client.get("https://ipinfo.io/json").send().await {
            Ok(response) => match response.json::<serde_json::Value>().await {
                Ok(data) => {
                    let city = data.get("city").and_then(|v| v.as_str()).unwrap_or("Unknown City");
                    let region = data.get("region").and_then(|v| v.as_str()).unwrap_or("Unknown Region");
                    let country = data.get("country").and_then(|v| v.as_str()).unwrap_or("Unknown Country");
                    return Ok(format!("{}, {}, {}", city, region, country));
                }
                Err(e) => {
                    last_error = format!("Failed to parse location (attempt {}): {}", attempt + 1, e);
                }
            },
            Err(e) => {
                last_error = format!("Failed to fetch location (attempt {}): {}", attempt + 1, e);
            }
        }
    }

    Err(last_error)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_diary_root_path,
            get_storage_path,
            set_storage_path,
            reset_storage_path,
            read_entry,
            write_entry,
            create_entry_with_template,
            entry_exists,
            get_past_entries,
            search_entries,
            get_entries_for_month,
            get_all_entry_dates,
            fetch_location,
            reverse_geocode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
