use axum::{body::Body, extract::{Request, State}, http::StatusCode, middleware::Next, response::Response};

use crate::api::ApiState;


pub async fn jwt_middleware(
    State(state): State<ApiState>,
    mut req: Request<Body>,
    next: Next
) -> Result<Response, StatusCode> {
     let auth = req
    .headers()
    .get("Authorization")
    .and_then(|v|v.to_str().ok())
    .and_then(|v| v.strip_prefix("Bearer "))
    .ok_or(  StatusCode::UNAUTHORIZED)?;
    let claims = state.jwt_service.parse(auth).map_err(|err| {
         eprintln!("JWT parsing error: {:?}", err);
          StatusCode::UNAUTHORIZED
    })?;

    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}