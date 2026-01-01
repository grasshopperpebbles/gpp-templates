//! Main entry point for the Tokio worker.

use std::sync::Arc;
use tokio::signal;
use tokio::sync::watch;
use tracing::{error, info, warn};

mod config;
mod health;
mod jobs;
mod queue;

use config::Config;
use jobs::JobRunner;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing/logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "worker=debug".into()),
        )
        .with_target(false)
        .init();

    info!("Starting worker...");

    // Load configuration
    let config = Arc::new(Config::from_env()?);

    // Create shutdown signal channel
    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    // Start health check server
    let health_config = config.clone();
    let health_shutdown = shutdown_rx.clone();
    let health_handle = tokio::spawn(async move {
        if let Err(e) = health::start_health_server(health_config, health_shutdown).await {
            error!("Health server error: {}", e);
        }
    });

    // Create and start the job runner
    let job_runner = JobRunner::new(config.clone());
    let runner_shutdown = shutdown_rx.clone();
    let runner_handle = tokio::spawn(async move {
        job_runner.run(runner_shutdown).await;
    });

    info!("Worker started successfully");

    // Wait for shutdown signal
    shutdown_signal().await;

    info!("Shutdown signal received, stopping worker...");

    // Signal all tasks to shutdown
    let _ = shutdown_tx.send(true);

    // Wait for tasks to complete with timeout
    let shutdown_timeout = tokio::time::Duration::from_secs(30);

    tokio::select! {
        _ = health_handle => {
            info!("Health server stopped");
        }
        _ = runner_handle => {
            info!("Job runner stopped");
        }
        _ = tokio::time::sleep(shutdown_timeout) => {
            warn!("Shutdown timeout reached, forcing exit");
        }
    }

    info!("Worker stopped");
    Ok(())
}

/// Wait for SIGTERM or SIGINT
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
