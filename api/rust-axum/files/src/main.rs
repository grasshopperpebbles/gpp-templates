//! Main entry point for the Axum API server.

use std::net::SocketAddr;
use tracing::info;

mod cache;
mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod routes;

use config::Config;
use routes::create_router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    // Initialize tracing/logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=debug".into()),
        )
        .with_target(false)
        .init();

    // Load configuration
    let config = Config::from_env()?;
    let addr = config.server_addr();

    info!("Starting server on {}", addr);

    // Build the router
    let app = create_router(config);

    // Create the server
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("Server listening on http://{}", addr);

    // Run the server
    axum::serve(listener, app).await?;

    Ok(())
}
