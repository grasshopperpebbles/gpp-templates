use serde::{Deserialize, Serialize};
use std::process::Command;

// File operations result
#[derive(Serialize, Deserialize)]
pub struct FileResult {
    pub success: bool,
    pub data: Option<String>,
    pub error: Option<String>,
}

// Command execution result
#[derive(Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

/// Read a file from the filesystem
#[tauri::command]
fn read_file(path: String) -> FileResult {
    match std::fs::read_to_string(&path) {
        Ok(content) => FileResult {
            success: true,
            data: Some(content),
            error: None,
        },
        Err(e) => FileResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// Write content to a file
#[tauri::command]
fn write_file(path: String, content: String) -> FileResult {
    match std::fs::write(&path, &content) {
        Ok(_) => FileResult {
            success: true,
            data: None,
            error: None,
        },
        Err(e) => FileResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// List directory contents
#[tauri::command]
fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                files.push(name.to_string());
            }
        }
    }

    Ok(files)
}

/// Execute a CLI command
#[tauri::command]
fn run_command(program: String, args: Vec<String>, cwd: Option<String>) -> CommandResult {
    let mut cmd = Command::new(&program);
    cmd.args(&args);

    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    match cmd.output() {
        Ok(output) => CommandResult {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            exit_code: output.status.code(),
        },
        Err(e) => CommandResult {
            success: false,
            stdout: String::new(),
            stderr: e.to_string(),
            exit_code: None,
        },
    }
}

/// Store a credential securely in the system keychain
#[tauri::command]
fn store_credential(service: String, account: String, password: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &account).map_err(|e| e.to_string())?;
    entry.set_password(&password).map_err(|e| e.to_string())?;
    Ok(())
}

/// Retrieve a credential from the system keychain
#[tauri::command]
fn get_credential(service: String, account: String) -> Result<String, String> {
    let entry = keyring::Entry::new(&service, &account).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

/// Delete a credential from the system keychain
#[tauri::command]
fn delete_credential(service: String, account: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &account).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
