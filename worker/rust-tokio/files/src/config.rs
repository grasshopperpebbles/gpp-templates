//! Worker configuration.

/// Worker configuration
#[derive(Debug, Clone)]
pub struct Config {
    /// Health check port
    pub health_port: u16,
    /// Number of concurrent workers
    pub concurrency: usize,
    /// Job poll interval in seconds
    pub poll_interval_secs: u64,
    /// Environment
    pub environment: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            health_port: std::env::var("HEALTH_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            concurrency: std::env::var("WORKER_CONCURRENCY")
                .unwrap_or_else(|_| "4".to_string())
                .parse()
                .unwrap_or(4),
            poll_interval_secs: std::env::var("POLL_INTERVAL_SECS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .unwrap_or(5),
            environment: std::env::var("ENVIRONMENT")
                .unwrap_or_else(|_| "development".to_string()),
        })
    }

    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            health_port: 8080,
            concurrency: 4,
            poll_interval_secs: 5,
            environment: "development".to_string(),
        }
    }
}
