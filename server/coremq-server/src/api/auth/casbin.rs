use axum::{
    Json,
    body::Body,
    extract::{Request, State},
    http::{self, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};

use crate::api::api_state::{ApiResponse, ApiState};
use casbin::CoreApi;
pub async fn auth_middleware(
    State(state): State<ApiState>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let path = req.uri().path().to_owned();
    let method = req.method().as_str().to_owned();

    println!("Incoming request: {} {}", method, path);
    if path.starts_with("/api/v1/public")
        || path.starts_with("/api/v1/auth")
        || req.method() == http::Method::OPTIONS
    {
        return next.run(req).await;
    }

    let token = match req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
    {
        Some(token) => token, 
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()>::error(
                    StatusCode::UNAUTHORIZED,
                    "Missing Authorization header",
                )),
            )
                .into_response();
        }
    };

    let claims = match state.jwt_service.parse(token) {
        Ok(claims) => {
            claims
        }
        Err(_) => {
            println!("Invalid token");
            return (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()>::error(
                    StatusCode::UNAUTHORIZED,
                    "Invalid token",
                )),
            )
                .into_response();
        }
    };

    req.extensions_mut().insert(claims.clone());

    let allowed = state
        .enforcer
        .enforce((&claims.role, &path, &method))
        .unwrap_or(false);

    if !allowed {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<()>::error(
                StatusCode::FORBIDDEN,
                "Access denied",
            )),
        )
            .into_response();
    }

    next.run(req).await
}
