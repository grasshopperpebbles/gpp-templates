//! Job definitions and runner.

mod example;

use std::sync::Arc;
use async_trait::async_trait;
use tokio::sync::watch;
use tracing::{error, info};

use crate::config::Config;

/// Trait for job implementations
#[async_trait]
pub trait Job: Send + Sync {
    /// Job name for logging
    fn name(&self) -> &str;

    /// Execute the job
    async fn execute(&self) -> anyhow::Result<()>;
}

/// Job runner that executes jobs on a schedule or from a queue
pub struct JobRunner {
    config: Arc<Config>,
    jobs: Vec<Box<dyn Job>>,
}

impl JobRunner {
    pub fn new(config: Arc<Config>) -> Self {
        // Register jobs here
        let jobs: Vec<Box<dyn Job>> = vec![
            Box::new(example::ExampleJob::new()),
            // Add more jobs here
        ];

        Self { config, jobs }
    }

    /// Run the job loop until shutdown
    pub async fn run(&self, mut shutdown: watch::Receiver<bool>) {
        info!("Job runner started with {} jobs", self.jobs.len());

        let poll_interval = tokio::time::Duration::from_secs(self.config.poll_interval_secs);

        loop {
            // Check for shutdown signal
            if *shutdown.borrow() {
                info!("Job runner received shutdown signal");
                break;
            }

            // Process jobs
            for job in &self.jobs {
                if let Err(e) = job.execute().await {
                    error!("Job '{}' failed: {}", job.name(), e);
                }
            }

            // Wait for next poll interval or shutdown
            tokio::select! {
                _ = tokio::time::sleep(poll_interval) => {}
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        break;
                    }
                }
            }
        }

        info!("Job runner stopped");
    }
}
