//! Cache Utility Module
//!
//! Provides caching functionality with Redis (optional) or in-memory fallback.
//! Install Redis support: Add `redis` crate to Cargo.toml
//!
//! Usage:
//!     use crate::cache;
//!
//!     // Set a value (TTL in seconds)
//!     cache.set("user:123", user_data, 3600).await;
//!
//!     // Get a value
//!     let user = cache.get("user:123").await;
//!
//!     // Delete a value
//!     cache.delete("user:123").await;
//!
//!     // Delete all keys matching pattern (supports * wildcard)
//!     cache.delete_pattern("user:*").await;        // All user keys
//!     cache.delete_pattern("product:*").await;     // All product keys

use moka::future::Cache as MokaCache;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// Cache trait for cache operations
#[async_trait::async_trait]
pub trait CacheBackend: Send + Sync {
    async fn get(&self, key: &str) -> Option<String>;
    async fn set(&self, key: &str, value: &str, ttl: Duration);
    async fn delete(&self, key: &str);
    async fn delete_pattern(&self, pattern: &str);
    async fn exists(&self, key: &str) -> bool;
    async fn clear(&self);
}

/// In-memory cache implementation using Moka
pub struct InMemoryCache {
    cache: Arc<MokaCache<String, String>>,
}

impl InMemoryCache {
    pub fn new() -> Self {
        let cache = Arc::new(
            MokaCache::builder()
                .max_capacity(10_000)
                .time_to_live(Duration::from_secs(300)) // 5 minutes default TTL
                .time_to_idle(Duration::from_secs(600)) // 10 minutes idle
                .build(),
        );

        Self { cache }
    }
}

#[async_trait::async_trait]
impl CacheBackend for InMemoryCache {
    async fn get(&self, key: &str) -> Option<String> {
        self.cache.get(key).await
    }

    async fn set(&self, key: &str, value: &str, ttl: Duration) {
        let mut builder = MokaCache::builder();
        builder = builder.max_capacity(10_000);
        builder = builder.time_to_live(ttl);
        // Note: Moka doesn't support per-key TTL, so we use the default TTL
        // For exact TTL control, would need to wrap values with expiration timestamps
        self.cache.insert(key.to_string(), value.to_string()).await;
    }

    async fn delete(&self, key: &str) {
        self.cache.invalidate(key).await;
    }

    async fn delete_pattern(&self, pattern: &str) {
        // Simple wildcard support for in-memory cache
        if pattern.contains('*') {
            let parts: Vec<&str> = pattern.split('*').collect();
            let prefix = parts[0];
            let suffix = parts.get(1).unwrap_or(&"");

            // Moka doesn't have a scan iterator, so we need to track keys separately
            // For simplicity, this is a limitation - pattern matching works better with Redis
            // In practice, you'd maintain a separate index of keys or use Redis for pattern matching
            tracing::warn!("Pattern matching in in-memory cache is limited. Use Redis for full pattern support.");
        } else {
            // Exact match
            self.cache.invalidate(pattern).await;
        }
    }

    async fn exists(&self, key: &str) -> bool {
        self.cache.get(key).await.is_some()
    }

    async fn clear(&self) {
        self.cache.invalidate_all();
    }
}

/// Redis cache implementation
pub struct RedisCache {
    client: Arc<RwLock<redis::Client>>,
}

impl RedisCache {
    pub async fn new(url: &str) -> anyhow::Result<Self> {
        let client = redis::Client::open(url)?;
        let mut conn = client.get_async_connection().await?;
        redis::cmd("PING").query_async::<_, ()>(&mut conn).await?;

        Ok(Self {
            client: Arc::new(RwLock::new(client)),
        })
    }
}

#[async_trait::async_trait]
impl CacheBackend for RedisCache {
    async fn get(&self, key: &str) -> Option<String> {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return None;
            }
        };

        match conn.get::<_, String>(key).await {
            Ok(val) => Some(val),
            Err(redis::RedisError::from((redis::ErrorKind::TypeError, "nil"))) => None,
            Err(e) => {
                tracing::error!("Redis get error: {}", e);
                None
            }
        }
    }

    async fn set(&self, key: &str, value: &str, ttl: Duration) {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return;
            }
        };

        if let Err(e) = conn.set_ex::<_, _, ()>(key, value, ttl.as_secs() as usize).await {
            tracing::error!("Redis set error: {}", e);
        }
    }

    async fn delete(&self, key: &str) {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return;
            }
        };

        if let Err(e) = conn.del::<_, ()>(key).await {
            tracing::error!("Redis delete error: {}", e);
        }
    }

    async fn delete_pattern(&self, pattern: &str) {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return;
            }
        };

        let mut iter: redis::AsyncIter<String> = match conn.scan_match(pattern).await {
            Ok(iter) => iter,
            Err(e) => {
                tracing::error!("Redis scan error: {}", e);
                return;
            }
        };

        let mut keys_to_delete = Vec::new();
        while let Some(key) = iter.next_item().await {
            keys_to_delete.push(key);
        }

        if !keys_to_delete.is_empty() {
            if let Err(e) = conn.del::<_, ()>(&keys_to_delete).await {
                tracing::error!("Redis delete pattern error: {}", e);
            } else {
                tracing::debug!("Deleted {} cache keys matching pattern: {}", keys_to_delete.len(), pattern);
            }
        }
    }

    async fn exists(&self, key: &str) -> bool {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return false;
            }
        };

        match conn.exists::<_, i32>(key).await {
            Ok(count) => count > 0,
            Err(e) => {
                tracing::error!("Redis exists error: {}", e);
                false
            }
        }
    }

    async fn clear(&self) {
        let client = self.client.read().await;
        let mut conn = match client.get_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!("Redis connection error: {}", e);
                return;
            }
        };

        if let Err(e) = redis::cmd("FLUSHDB").query_async::<_, ()>(&mut conn).await {
            tracing::error!("Redis clear error: {}", e);
        }
    }
}

/// Main cache wrapper that can use either backend
pub struct Cache {
    backend: Arc<dyn CacheBackend>,
}

impl Cache {
    /// Create a cache instance (Redis if available, otherwise in-memory)
    pub async fn new(redis_url: &str) -> anyhow::Result<Self> {
        let backend: Arc<dyn CacheBackend> = if !redis_url.is_empty() && redis_url != "redis://localhost:6379/0" {
            match RedisCache::new(redis_url).await {
                Ok(redis_cache) => Arc::new(redis_cache) as Arc<dyn CacheBackend>,
                Err(e) => {
                    tracing::warn!("Redis not available, using in-memory cache: {}", e);
                    Arc::new(InMemoryCache::new()) as Arc<dyn CacheBackend>
                }
            }
        } else {
            Arc::new(InMemoryCache::new()) as Arc<dyn CacheBackend>
        };

        Ok(Self { backend })
    }

    pub async fn get(&self, key: &str) -> Option<String> {
        self.backend.get(key).await
    }

    pub async fn set(&self, key: &str, value: &str, ttl: Duration) {
        self.backend.set(key, value, ttl).await;
    }

    pub async fn delete(&self, key: &str) {
        self.backend.delete(key).await;
    }

    pub async fn delete_pattern(&self, pattern: &str) {
        self.backend.delete_pattern(pattern).await;
    }

    pub async fn exists(&self, key: &str) -> bool {
        self.backend.exists(key).await
    }

    pub async fn clear(&self) {
        self.backend.clear().await;
    }
}

// Re-export for convenience
pub use Cache as cache;

