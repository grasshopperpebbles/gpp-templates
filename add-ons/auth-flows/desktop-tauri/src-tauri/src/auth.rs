// Auth commands for Tauri desktop authentication
// Provides secure credential storage and OAuth support

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::command;

const SERVICE_NAME: &str = "gpp-desktop-app";

#[derive(Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
}

/// Store authentication tokens securely in system keychain
#[command]
pub fn store_auth_tokens(user_id: &str, tokens: AuthTokens) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, user_id).map_err(|e| e.to_string())?;
    let tokens_json = serde_json::to_string(&tokens).map_err(|e| e.to_string())?;
    entry.set_password(&tokens_json).map_err(|e| e.to_string())?;
    Ok(())
}

/// Retrieve authentication tokens from system keychain
#[command]
pub fn get_auth_tokens(user_id: &str) -> Result<Option<AuthTokens>, String> {
    let entry = Entry::new(SERVICE_NAME, user_id).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(tokens_json) => {
            let tokens: AuthTokens =
                serde_json::from_str(&tokens_json).map_err(|e| e.to_string())?;
            Ok(Some(tokens))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Remove authentication tokens from system keychain
#[command]
pub fn clear_auth_tokens(user_id: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, user_id).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(e.to_string()),
    }
}

/// Check if user is authenticated (has valid tokens)
#[command]
pub fn is_authenticated(user_id: &str) -> Result<bool, String> {
    match get_auth_tokens(user_id)? {
        Some(tokens) => {
            // Check if token is expired
            if let Some(expires_at) = tokens.expires_at {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| e.to_string())?
                    .as_secs() as i64;
                Ok(now < expires_at)
            } else {
                Ok(true) // No expiry set, assume valid
            }
        }
        None => Ok(false),
    }
}

/// Store current user info
#[command]
pub fn store_user_info(user: UserInfo) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "current_user").map_err(|e| e.to_string())?;
    let user_json = serde_json::to_string(&user).map_err(|e| e.to_string())?;
    entry.set_password(&user_json).map_err(|e| e.to_string())?;
    Ok(())
}

/// Get current user info
#[command]
pub fn get_current_user() -> Result<Option<UserInfo>, String> {
    let entry = Entry::new(SERVICE_NAME, "current_user").map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(user_json) => {
            let user: UserInfo = serde_json::from_str(&user_json).map_err(|e| e.to_string())?;
            Ok(Some(user))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Clear all auth data (logout)
#[command]
pub fn logout() -> Result<(), String> {
    // Clear current user
    let user_entry = Entry::new(SERVICE_NAME, "current_user").map_err(|e| e.to_string())?;
    let _ = user_entry.delete_credential(); // Ignore if not exists

    // Note: To clear user-specific tokens, call clear_auth_tokens(user_id) before logout
    Ok(())
}
