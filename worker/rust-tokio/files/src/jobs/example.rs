//! Example job implementation.
//!
//! Replace this with your actual job implementations.

use async_trait::async_trait;
use tracing::info;

use super::Job;

/// Example job that demonstrates the job interface
pub struct ExampleJob {
    name: String,
}

impl ExampleJob {
    pub fn new() -> Self {
        Self {
            name: "example".to_string(),
        }
    }
}

#[async_trait]
impl Job for ExampleJob {
    fn name(&self) -> &str {
        &self.name
    }

    async fn execute(&self) -> anyhow::Result<()> {
        info!("Executing example job...");

        // TODO: Replace with actual job logic
        // Examples:
        // - Process items from a queue
        // - Send scheduled emails
        // - Clean up old data
        // - Sync with external APIs
        // - Generate reports

        // Simulate some work
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        info!("Example job completed");
        Ok(())
    }
}

impl Default for ExampleJob {
    fn default() -> Self {
        Self::new()
    }
}
