//! Route definitions and router setup.

use axum::{
    http::{header, Method},
    routing::get,
    Router,
};
use std::time::Duration;
use tower_http::{
    cors::{Any, CorsLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};

use crate::config::Config;
use crate::handlers;

/// Create the application router with all routes and middleware
pub fn create_router(config: Config) -> Router {
    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        .allow_origin(Any); // TODO: Restrict in production using config.cors_origins

    // Build the API routes
    let api_routes = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/health/ready", get(handlers::health::readiness_check))
        .route("/health/live", get(handlers::health::liveness_check))
        // Add your API routes here
        .nest("/items", item_routes());

    // Build the main router
    Router::new()
        .nest("/api/v1", api_routes)
        .layer(TraceLayer::new_for_http())
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        .layer(cors)
        .with_state(AppState::new(config))
}

/// Item-related routes (example)
fn item_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::items::list_items).post(handlers::items::create_item))
        .route(
            "/:id",
            get(handlers::items::get_item)
                .put(handlers::items::update_item)
                .delete(handlers::items::delete_item),
        )
}

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    // Add database pool, HTTP clients, etc. here
}

impl AppState {
    pub fn new(config: Config) -> Self {
        Self { config }
    }
}
