use axum::{extract::{Path, Query, State}, response::Json};

use crate::{
  api::api_state::{ApiResponse, ApiState}, engine::AdminCommand, models::{pagination::Page, session::Session, session_query::SessionQuery}
};

use tokio::sync::oneshot;
use axum::http::StatusCode;

pub async fn get_sessions(
    State(state): State<ApiState>,
    Query(params): Query<SessionQuery>
) -> Result<Json<ApiResponse< Page<Session>>>, StatusCode> {
    let page = params.page.unwrap_or(0);  // default page = 0
    let size = params.size.unwrap_or(10); // default size = 10
   // let search = params.search.unwrap_or_default(); // default empty search

    let (reply_tx, reply_rx) = oneshot::channel();

    state
        .engine
        .send(AdminCommand::GetClients(reply_tx, page, size))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let sessions = reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(sessions, "successfully fetched data")))
}

pub async fn disconnect_session(
    State(state): State<ApiState>,
    Path(client_id): Path<String>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let (reply_tx, reply_rx) = oneshot::channel();

    state
        .engine
        .send(AdminCommand::DisconnectClient(client_id.clone(), reply_tx))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let found = reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if found {
        Ok(Json(ApiResponse::success(client_id, "client disconnected")))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

