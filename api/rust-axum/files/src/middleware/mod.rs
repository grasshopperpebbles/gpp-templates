//! Custom middleware for the API.

use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use tracing::info;

/// Request logging middleware
pub async fn request_logger(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start = std::time::Instant::now();

    let response = next.run(request).await;

    let duration = start.elapsed();
    let status = response.status();

    info!(
        method = %method,
        uri = %uri,
        status = %status.as_u16(),
        duration_ms = %duration.as_millis(),
        "Request completed"
    );

    response
}

/// Request ID middleware - adds a unique ID to each request
pub async fn request_id(mut request: Request, next: Next) -> Response {
    let request_id = uuid::Uuid::new_v4().to_string();

    request
        .headers_mut()
        .insert("x-request-id", request_id.parse().unwrap());

    let mut response = next.run(request).await;

    response
        .headers_mut()
        .insert("x-request-id", request_id.parse().unwrap());

    response
}

/// Authentication middleware placeholder
/// Replace with your actual authentication logic
pub async fn require_auth(request: Request, next: Next) -> Result<Response, StatusCode> {
    // Check for Authorization header
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            // TODO: Validate the token
            let _token = &header[7..];

            // If valid, continue to the handler
            Ok(next.run(request).await)
        }
        _ => {
            // Return 401 Unauthorized
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
