//! Item CRUD handlers - example resource handlers.
//!
//! Replace "Item" with your actual resource name (User, Product, Order, etc.)

use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, Result};
use crate::routes::AppState;

/// Item model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Request body for creating an item
#[derive(Debug, Deserialize)]
pub struct CreateItemRequest {
    pub name: String,
    pub description: Option<String>,
}

/// Request body for updating an item
#[derive(Debug, Deserialize)]
pub struct UpdateItemRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

/// Response for list operations
#[derive(Serialize)]
pub struct ListResponse<T> {
    pub data: Vec<T>,
    pub total: usize,
}

/// List all items
pub async fn list_items(State(_state): State<AppState>) -> Result<Json<ListResponse<Item>>> {
    // TODO: Replace with database query
    let items = vec![
        Item {
            id: Uuid::new_v4(),
            name: "Example Item".to_string(),
            description: Some("This is an example item".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        },
    ];

    Ok(Json(ListResponse {
        total: items.len(),
        data: items,
    }))
}

/// Get a single item by ID
pub async fn get_item(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Item>> {
    // TODO: Replace with database query
    let item = Item {
        id,
        name: "Example Item".to_string(),
        description: Some("This is an example item".to_string()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    Ok(Json(item))
}

/// Create a new item
pub async fn create_item(
    State(_state): State<AppState>,
    Json(payload): Json<CreateItemRequest>,
) -> Result<Json<Item>> {
    // Validate input
    if payload.name.trim().is_empty() {
        return Err(AppError::Validation("Name cannot be empty".to_string()));
    }

    // TODO: Replace with database insert
    let item = Item {
        id: Uuid::new_v4(),
        name: payload.name,
        description: payload.description,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    Ok(Json(item))
}

/// Update an existing item
pub async fn update_item(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateItemRequest>,
) -> Result<Json<Item>> {
    // TODO: Replace with database update
    let item = Item {
        id,
        name: payload.name.unwrap_or_else(|| "Updated Item".to_string()),
        description: payload.description,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    Ok(Json(item))
}

/// Delete an item
pub async fn delete_item(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Replace with database delete
    let _ = id; // Suppress unused warning

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Item deleted successfully"
    })))
}
