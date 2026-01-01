//! Health check endpoints for Kubernetes probes and monitoring.

use axum::Json;
use serde::Serialize;

/// Health check response
#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

/// Basic health check - always returns OK if the server is running
pub async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        message: None,
    })
}

/// Readiness check - returns OK when the application is ready to receive traffic
/// Add checks for database connections, external services, etc.
pub async fn readiness_check() -> Json<HealthResponse> {
    // TODO: Add database connection check
    // TODO: Add external service checks

    Json(HealthResponse {
        status: "ready".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        message: None,
    })
}

/// Liveness check - returns OK if the application is alive
/// This should be a lightweight check that doesn't depend on external services
pub async fn liveness_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "alive".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        message: None,
    })
}
