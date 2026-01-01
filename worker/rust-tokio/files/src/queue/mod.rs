//! Job queue abstractions.
//!
//! This module provides a simple in-memory queue implementation.
//! For production, replace with Redis, RabbitMQ, or another message broker.

use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// A job message in the queue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobMessage {
    pub id: Uuid,
    pub job_type: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub attempts: u32,
    pub max_attempts: u32,
}

impl JobMessage {
    pub fn new(job_type: impl Into<String>, payload: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4(),
            job_type: job_type.into(),
            payload,
            created_at: Utc::now(),
            attempts: 0,
            max_attempts: 3,
        }
    }

    pub fn can_retry(&self) -> bool {
        self.attempts < self.max_attempts
    }

    pub fn increment_attempts(&mut self) {
        self.attempts += 1;
    }
}

/// Simple in-memory queue (replace with Redis/RabbitMQ for production)
#[derive(Clone)]
pub struct InMemoryQueue {
    queue: Arc<Mutex<VecDeque<JobMessage>>>,
}

impl InMemoryQueue {
    pub fn new() -> Self {
        Self {
            queue: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    /// Push a job to the queue
    pub async fn push(&self, message: JobMessage) {
        let mut queue = self.queue.lock().await;
        queue.push_back(message);
    }

    /// Pop a job from the queue
    pub async fn pop(&self) -> Option<JobMessage> {
        let mut queue = self.queue.lock().await;
        queue.pop_front()
    }

    /// Get the queue length
    pub async fn len(&self) -> usize {
        let queue = self.queue.lock().await;
        queue.len()
    }

    /// Check if the queue is empty
    pub async fn is_empty(&self) -> bool {
        let queue = self.queue.lock().await;
        queue.is_empty()
    }
}

impl Default for InMemoryQueue {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_queue_push_pop() {
        let queue = InMemoryQueue::new();
        let message = JobMessage::new("test", serde_json::json!({"key": "value"}));

        queue.push(message.clone()).await;
        assert_eq!(queue.len().await, 1);

        let popped = queue.pop().await.unwrap();
        assert_eq!(popped.job_type, "test");
        assert!(queue.is_empty().await);
    }
}
