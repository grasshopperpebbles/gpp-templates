use serde::{Deserialize, Serialize};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Manager};

/// Programs the webview may run through `run_command`. Anything else is refused, so a
/// script injected into the page cannot start arbitrary processes. Add entries with care:
/// the webview controls the arguments.
const ALLOWED_PROGRAMS: &[&str] = &["gpp"];

// File operations result
#[derive(Serialize, Deserialize)]
pub struct FileResult {
    pub success: bool,
    pub data: Option<String>,
    pub error: Option<String>,
}

impl FileResult {
    fn err(e: impl ToString) -> Self {
        FileResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }
    }
}

// Command execution result
#[derive(Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

impl CommandResult {
    fn err(e: impl ToString) -> Self {
        CommandResult {
            success: false,
            stdout: String::new(),
            stderr: e.to_string(),
            exit_code: None,
        }
    }
}

/// Joins `rel` onto `base`, refusing absolute paths and `..`, so file commands stay
/// inside the app data folder.
fn resolve_within(base: &Path, rel: &str) -> Result<PathBuf, String> {
    let rel_path = Path::new(rel);
    let safe = rel_path
        .components()
        .all(|c| matches!(c, Component::Normal(_) | Component::CurDir));
    if !safe {
        return Err(format!(
            "path must be relative to the app data folder, without '..': {rel}"
        ));
    }
    Ok(base.join(rel_path))
}

fn is_allowed_program(program: &str) -> bool {
    ALLOWED_PROGRAMS.contains(&program)
}

/// The app data folder (created on first use); file commands are confined to it.
fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn data_path(app: &AppHandle, rel: &str) -> Result<PathBuf, String> {
    resolve_within(&app_data_dir(app)?, rel)
}

/// Read a file from the app data folder
#[tauri::command]
fn read_file(app: AppHandle, path: String) -> FileResult {
    let full = match data_path(&app, &path) {
        Ok(p) => p,
        Err(e) => return FileResult::err(e),
    };
    match std::fs::read_to_string(full) {
        Ok(content) => FileResult {
            success: true,
            data: Some(content),
            error: None,
        },
        Err(e) => FileResult::err(e),
    }
}

/// Write content to a file in the app data folder
#[tauri::command]
fn write_file(app: AppHandle, path: String, content: String) -> FileResult {
    let full = match data_path(&app, &path) {
        Ok(p) => p,
        Err(e) => return FileResult::err(e),
    };
    if let Some(parent) = full.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            return FileResult::err(e);
        }
    }
    match std::fs::write(full, content) {
        Ok(_) => FileResult {
            success: true,
            data: None,
            error: None,
        },
        Err(e) => FileResult::err(e),
    }
}

/// List a directory in the app data folder ("" for the folder itself)
#[tauri::command]
fn list_directory(app: AppHandle, path: String) -> Result<Vec<String>, String> {
    let entries = std::fs::read_dir(data_path(&app, &path)?).map_err(|e| e.to_string())?;
    Ok(entries
        .flatten()
        .filter_map(|entry| entry.file_name().to_str().map(str::to_string))
        .collect())
}

/// Execute an allowlisted CLI command (see ALLOWED_PROGRAMS). Runs off the main thread.
#[tauri::command]
async fn run_command(program: String, args: Vec<String>, cwd: Option<String>) -> CommandResult {
    if !is_allowed_program(&program) {
        return CommandResult::err(format!("program not allowed: {program}"));
    }
    let output = tauri::async_runtime::spawn_blocking(move || {
        let mut cmd = Command::new(&program);
        cmd.args(&args);
        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }
        cmd.output()
    })
    .await;

    match output {
        Ok(Ok(output)) => CommandResult {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            exit_code: output.status.code(),
        },
        Ok(Err(e)) => CommandResult::err(e),
        Err(e) => CommandResult::err(e),
    }
}

/// Keychain entry for `account` under this app's identifier, so the webview can only
/// reach credentials this app stored.
fn credential_entry(app: &AppHandle, account: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(&app.config().identifier, account).map_err(|e| e.to_string())
}

/// Store a credential securely in the system keychain
#[tauri::command]
fn store_credential(app: AppHandle, account: String, password: String) -> Result<(), String> {
    credential_entry(&app, &account)?
        .set_password(&password)
        .map_err(|e| e.to_string())
}

/// Retrieve a credential from the system keychain
#[tauri::command]
fn get_credential(app: AppHandle, account: String) -> Result<String, String> {
    credential_entry(&app, &account)?
        .get_password()
        .map_err(|e| e.to_string())
}

/// Delete a credential from the system keychain
#[tauri::command]
fn delete_credential(app: AppHandle, account: String) -> Result<(), String> {
    credential_entry(&app, &account)?
        .delete_credential()
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_directory,
            run_command,
            store_credential,
            get_credential,
            delete_credential,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_within_accepts_relative_paths() {
        let base = Path::new("/data");
        assert_eq!(resolve_within(base, "").unwrap(), PathBuf::from("/data"));
        assert_eq!(
            resolve_within(base, "notes/a.txt").unwrap(),
            PathBuf::from("/data/notes/a.txt")
        );
        assert_eq!(
            resolve_within(base, "./a.txt").unwrap(),
            PathBuf::from("/data/a.txt")
        );
    }

    #[test]
    fn resolve_within_rejects_escapes() {
        let base = Path::new("/data");
        assert!(resolve_within(base, "../secret").is_err());
        assert!(resolve_within(base, "notes/../../secret").is_err());
        assert!(resolve_within(base, "/etc/passwd").is_err());
    }

    #[test]
    fn only_allowlisted_programs_run() {
        assert!(is_allowed_program("gpp"));
        assert!(!is_allowed_program("sh"));
        assert!(!is_allowed_program("/usr/bin/gpp"));
        assert!(!is_allowed_program(""));
    }
}
