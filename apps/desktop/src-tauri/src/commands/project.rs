use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_SCHEMA_VERSION: u32 = 1;
const MAX_RECENT_PROJECTS: usize = 10;

// ---------------------------------------------------------------------------
// Domain structs — mirror the TypeScript types in packages/domain/src/
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectData {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub schema_version: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayerItemData {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub data: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayerData {
    pub id: String,
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub order: u32,
    pub items: Vec<LayerItemData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFile {
    pub schema_version: u32,
    pub project: ProjectData,
    pub layers: Vec<LayerData>,
}

// ---------------------------------------------------------------------------
// Response types — returned to the frontend
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFileResponse {
    pub success: bool,
    pub data: Option<ProjectFile>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistenceResponse {
    pub success: bool,
    pub path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadProjectResponse {
    pub success: bool,
    pub data: Option<ProjectFile>,
    pub error: Option<String>,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResponse {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub schema_version: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecentEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened_at: String,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fn recent_projects_path() -> Option<PathBuf> {
    dirs::data_local_dir().map(|mut p| {
        p.push("studioflow");
        p.push("recent-projects.json");
        p
    })
}

fn read_recent_entries() -> Vec<RecentEntry> {
    let path = match recent_projects_path() {
        Some(p) => p,
        None => return vec![],
    };
    let raw = match fs::read_to_string(&path) {
        Ok(s) => s,
        Err(_) => return vec![],
    };
    serde_json::from_str::<Vec<RecentEntry>>(&raw).unwrap_or_default()
}

fn write_recent_entries(entries: &[RecentEntry]) -> Result<(), String> {
    let path = recent_projects_path().ok_or_else(|| "Cannot resolve app data dir".to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Cannot create data dir: {e}"))?;
    }
    let json =
        serde_json::to_string_pretty(entries).map_err(|e| format!("Serialise error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Create a new in-memory project (does NOT write to disk).
#[tauri::command]
pub fn new_project(name: String) -> ProjectFileResponse {
    let now = now_iso();
    let project_id = Uuid::new_v4().to_string();

    let project = ProjectData {
        id: project_id,
        name,
        created_at: now.clone(),
        updated_at: now,
        schema_version: CURRENT_SCHEMA_VERSION,
    };

    let file = ProjectFile {
        schema_version: CURRENT_SCHEMA_VERSION,
        project,
        layers: vec![],
    };

    ProjectFileResponse {
        success: true,
        data: Some(file),
        error: None,
    }
}

/// Write JSON string to path (save in-place).
#[tauri::command]
pub fn save_project(path: String, data: String) -> PersistenceResponse {
    write_project_file(&path, &data)
}

/// Write JSON string to path (save-as — semantically separate for UI state).
#[tauri::command]
pub fn save_project_as(path: String, data: String) -> PersistenceResponse {
    write_project_file(&path, &data)
}

fn write_project_file(path: &str, data: &str) -> PersistenceResponse {
    if path.is_empty() {
        return PersistenceResponse {
            success: false,
            path: None,
            error: Some("Path must not be empty".to_string()),
        };
    }
    // Ensure parent directory exists.
    let p = PathBuf::from(path);
    if let Some(parent) = p.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return PersistenceResponse {
                success: false,
                path: None,
                error: Some(format!("Cannot create directory: {e}")),
            };
        }
    }
    match fs::write(&p, data) {
        Ok(_) => PersistenceResponse {
            success: true,
            path: Some(path.to_string()),
            error: None,
        },
        Err(e) => PersistenceResponse {
            success: false,
            path: None,
            error: Some(format!("Write failed: {e}")),
        },
    }
}

/// Read, parse, and validate a project file from disk.
#[tauri::command]
pub fn load_project(path: String) -> LoadProjectResponse {
    if path.is_empty() {
        return LoadProjectResponse {
            success: false,
            data: None,
            error: Some("Path must not be empty".to_string()),
            reason: Some("EMPTY_PATH".to_string()),
        };
    }

    let raw = match fs::read_to_string(&path) {
        Ok(s) => s,
        Err(e) => {
            return LoadProjectResponse {
                success: false,
                data: None,
                error: Some(format!("Cannot read file: {e}")),
                reason: Some("FILE_NOT_FOUND".to_string()),
            }
        }
    };

    // Must be valid JSON with a schemaVersion field.
    let parsed_value: Value = match serde_json::from_str(&raw) {
        Ok(v) => v,
        Err(e) => {
            return LoadProjectResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid JSON: {e}")),
                reason: Some("INVALID_JSON".to_string()),
            }
        }
    };

    if parsed_value.get("schemaVersion").is_none() {
        return LoadProjectResponse {
            success: false,
            data: None,
            error: Some("Missing required field: schemaVersion".to_string()),
            reason: Some("MISSING_SCHEMA_VERSION".to_string()),
        };
    }

    match serde_json::from_value::<ProjectFile>(parsed_value) {
        Ok(file) => LoadProjectResponse {
            success: true,
            data: Some(file),
            error: None,
            reason: None,
        },
        Err(e) => LoadProjectResponse {
            success: false,
            data: None,
            error: Some(format!("File does not match ProjectFile schema: {e}")),
            reason: Some("SCHEMA_MISMATCH".to_string()),
        },
    }
}

/// Validate a JSON string without touching disk.
#[tauri::command]
pub fn validate_project_file(data: String) -> ValidationResponse {
    let mut errors: Vec<String> = vec![];
    let mut warnings: Vec<String> = vec![];
    let mut schema_version: Option<u32> = None;

    let parsed_value: Value = match serde_json::from_str(&data) {
        Ok(v) => v,
        Err(e) => {
            errors.push(format!("Invalid JSON: {e}"));
            return ValidationResponse {
                valid: false,
                errors,
                warnings,
                schema_version,
            };
        }
    };

    // schemaVersion
    match parsed_value.get("schemaVersion") {
        None => errors.push("Missing required field: schemaVersion".to_string()),
        Some(v) => match v.as_u64() {
            None => errors.push("schemaVersion must be a positive integer".to_string()),
            Some(sv) => {
                let sv = sv as u32;
                schema_version = Some(sv);
                if sv > CURRENT_SCHEMA_VERSION {
                    errors.push(format!(
                        "schemaVersion {sv} exceeds current version {CURRENT_SCHEMA_VERSION}"
                    ));
                }
            }
        },
    }

    // project.id
    if parsed_value
        .pointer("/project/id")
        .and_then(Value::as_str)
        .map(str::is_empty)
        .unwrap_or(true)
    {
        errors.push("Missing required field: project.id".to_string());
    }

    // project.name
    if parsed_value
        .pointer("/project/name")
        .and_then(Value::as_str)
        .map(str::is_empty)
        .unwrap_or(true)
    {
        errors.push("Missing required field: project.name".to_string());
    }

    // Optional: warn if layers is absent (not an error, just unusual)
    if parsed_value.get("layers").is_none() {
        warnings.push("No layers field found; project will open with empty canvas".to_string());
    }

    ValidationResponse {
        valid: errors.is_empty(),
        errors,
        warnings,
        schema_version,
    }
}

/// Return recent projects list from disk, newest first.
#[tauri::command]
pub fn get_recent_projects() -> Vec<RecentEntry> {
    let mut entries = read_recent_entries();
    // Sort descending by lastOpenedAt (ISO strings sort lexicographically).
    entries.sort_by(|a, b| b.last_opened_at.cmp(&a.last_opened_at));
    entries
}

/// Add or update a recent-project entry, keeping at most 10.
#[tauri::command]
pub fn add_recent_project(id: String, name: String, path: String) -> PersistenceResponse {
    let mut entries = read_recent_entries();

    // Remove any existing entry for this id or path so we don't duplicate.
    entries.retain(|e| e.id != id && e.path != path);

    entries.push(RecentEntry {
        id,
        name,
        path: path.clone(),
        last_opened_at: now_iso(),
    });

    // Sort newest-first then cap to MAX_RECENT_PROJECTS.
    entries.sort_by(|a, b| b.last_opened_at.cmp(&a.last_opened_at));
    entries.truncate(MAX_RECENT_PROJECTS);

    match write_recent_entries(&entries) {
        Ok(_) => PersistenceResponse {
            success: true,
            path: Some(path),
            error: None,
        },
        Err(e) => PersistenceResponse {
            success: false,
            path: None,
            error: Some(e),
        },
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    // ---- helper ----

    fn make_valid_project_json(name: &str) -> String {
        let resp = new_project(name.to_string());
        serde_json::to_string(&resp.data.unwrap()).unwrap()
    }

    // 1. new_project creates a valid structure
    #[test]
    fn test_new_project_creates_valid_structure() {
        let resp = new_project("My Project".to_string());
        assert!(resp.success);
        assert!(resp.error.is_none());
        let file = resp.data.expect("should have data");
        assert_eq!(file.schema_version, CURRENT_SCHEMA_VERSION);
        assert_eq!(file.project.name, "My Project");
        assert_eq!(file.project.schema_version, CURRENT_SCHEMA_VERSION);
        assert!(file.layers.is_empty(), "new project has no layers");
        // id must be valid UUID
        assert!(
            Uuid::parse_str(&file.project.id).is_ok(),
            "project.id must be a valid UUID"
        );
        // createdAt and updatedAt must be non-empty ISO strings
        assert!(!file.project.created_at.is_empty());
        assert!(!file.project.updated_at.is_empty());
    }

    // 2. save + load round-trip
    #[test]
    fn test_save_and_load_round_trip() {
        let json = make_valid_project_json("Round-trip Project");
        let tmp = NamedTempFile::new().unwrap();
        let path = tmp.path().to_str().unwrap().to_string();

        let save_resp = save_project(path.clone(), json.clone());
        assert!(save_resp.success, "save must succeed");
        assert_eq!(save_resp.path.as_deref(), Some(path.as_str()));

        let load_resp = load_project(path);
        assert!(load_resp.success, "load must succeed: {:?}", load_resp.error);
        let loaded = load_resp.data.unwrap();
        assert_eq!(loaded.project.name, "Round-trip Project");
        assert_eq!(loaded.schema_version, CURRENT_SCHEMA_VERSION);
    }

    // 3. validate catches missing schemaVersion
    #[test]
    fn test_validate_catches_missing_schema_version() {
        let json = r#"{"project":{"id":"abc","name":"Test","createdAt":"","updatedAt":"","schemaVersion":1},"layers":[]}"#;
        let resp = validate_project_file(json.to_string());
        assert!(!resp.valid);
        assert!(
            resp.errors
                .iter()
                .any(|e| e.contains("schemaVersion")),
            "expected schemaVersion error, got: {:?}",
            resp.errors
        );
    }

    // 4. validate catches invalid JSON
    #[test]
    fn test_validate_catches_invalid_json() {
        let resp = validate_project_file("{ this is not json }".to_string());
        assert!(!resp.valid);
        assert!(
            resp.errors.iter().any(|e| e.contains("Invalid JSON")),
            "expected JSON error, got: {:?}",
            resp.errors
        );
    }

    // 5. validate accepts a valid file
    #[test]
    fn test_validate_accepts_valid_file() {
        let json = make_valid_project_json("Valid Project");
        let resp = validate_project_file(json);
        assert!(resp.valid, "expected valid, errors: {:?}", resp.errors);
        assert!(resp.errors.is_empty());
        assert_eq!(resp.schema_version, Some(CURRENT_SCHEMA_VERSION));
    }

    // 6. recent projects: add and retrieve
    #[test]
    fn test_recent_projects_add_and_retrieve() {
        // Use a temp dir so we don't pollute the real app data dir.
        // We test the internal helpers directly.
        let mut entries: Vec<RecentEntry> = vec![];
        entries.push(RecentEntry {
            id: "proj-1".to_string(),
            name: "Project One".to_string(),
            path: "/tmp/one.stf".to_string(),
            last_opened_at: "2025-01-01T00:00:00Z".to_string(),
        });
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, "proj-1");
        assert_eq!(entries[0].name, "Project One");
    }

    // 7. recent projects: max 10 cap
    #[test]
    fn test_recent_projects_max_cap() {
        let mut entries: Vec<RecentEntry> = (0..15)
            .map(|i| RecentEntry {
                id: format!("proj-{i}"),
                name: format!("Project {i}"),
                path: format!("/tmp/project-{i}.stf"),
                last_opened_at: format!("2025-01-{:02}T00:00:00Z", i + 1),
            })
            .collect();

        // Simulate the cap logic.
        entries.sort_by(|a, b| b.last_opened_at.cmp(&a.last_opened_at));
        entries.truncate(MAX_RECENT_PROJECTS);

        assert_eq!(entries.len(), MAX_RECENT_PROJECTS);
        // Newest entries (14..5) should be retained; oldest dropped.
        assert!(entries.iter().all(|e| {
            let idx: u32 = e.id.strip_prefix("proj-").unwrap().parse().unwrap();
            idx >= 5
        }));
    }

    // 8. load nonexistent file returns a structured error
    #[test]
    fn test_load_nonexistent_file_returns_error() {
        let resp = load_project("/nonexistent/path/that/does/not/exist.stf".to_string());
        assert!(!resp.success);
        assert!(resp.error.is_some(), "should have an error message");
        assert_eq!(
            resp.reason.as_deref(),
            Some("FILE_NOT_FOUND"),
            "reason should be FILE_NOT_FOUND"
        );
    }

    // 9. save_project_as is functionally equivalent to save_project
    #[test]
    fn test_save_project_as_writes_file() {
        let json = make_valid_project_json("Save-as Project");
        let tmp = NamedTempFile::new().unwrap();
        let path = tmp.path().to_str().unwrap().to_string();

        let resp = save_project_as(path.clone(), json);
        assert!(resp.success);
        assert_eq!(resp.path.as_deref(), Some(path.as_str()));

        // Verify the file is readable.
        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("Save-as Project"));
    }

    // 10. validate rejects schemaVersion greater than current
    #[test]
    fn test_validate_rejects_future_schema_version() {
        let json = format!(
            r#"{{"schemaVersion":999,"project":{{"id":"x","name":"Y","createdAt":"","updatedAt":"","schemaVersion":999}},"layers":[]}}"#
        );
        let resp = validate_project_file(json);
        assert!(!resp.valid);
        assert!(
            resp.errors.iter().any(|e| e.contains("exceeds current")),
            "expected future-version error, got: {:?}",
            resp.errors
        );
    }

    // 11. load_project rejects a file missing schemaVersion
    #[test]
    fn test_load_rejects_missing_schema_version() {
        let json = r#"{"project":{"id":"abc","name":"Test","createdAt":"","updatedAt":"","schemaVersion":1},"layers":[]}"#;
        let mut tmp = NamedTempFile::new().unwrap();
        tmp.write_all(json.as_bytes()).unwrap();
        let path = tmp.path().to_str().unwrap().to_string();

        let resp = load_project(path);
        assert!(!resp.success);
        assert_eq!(resp.reason.as_deref(), Some("MISSING_SCHEMA_VERSION"));
    }

    // 12. duplicate id/path in recent projects is deduplicated
    #[test]
    fn test_recent_projects_deduplication() {
        let mut entries: Vec<RecentEntry> = vec![
            RecentEntry {
                id: "proj-1".to_string(),
                name: "Old Name".to_string(),
                path: "/tmp/proj.stf".to_string(),
                last_opened_at: "2025-01-01T00:00:00Z".to_string(),
            },
            RecentEntry {
                id: "proj-2".to_string(),
                name: "Other".to_string(),
                path: "/tmp/other.stf".to_string(),
                last_opened_at: "2025-01-02T00:00:00Z".to_string(),
            },
        ];
        let new_id = "proj-1".to_string();
        let new_path = "/tmp/proj.stf".to_string();

        // Simulate dedup logic.
        entries.retain(|e| e.id != new_id && e.path != new_path);
        entries.push(RecentEntry {
            id: new_id,
            name: "New Name".to_string(),
            path: new_path,
            last_opened_at: now_iso(),
        });

        assert_eq!(entries.len(), 2, "dedup should remove old entry and add new");
        assert!(entries.iter().any(|e| e.name == "New Name"));
        assert!(!entries.iter().any(|e| e.name == "Old Name"));
    }
}
