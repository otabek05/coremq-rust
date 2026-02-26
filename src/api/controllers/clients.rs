use axum::{response::Json, extract::State};

use crate::{

    api::app_state::ApiState, engine::AdminCommand, models::{pagination::Page, session::Session}
};

use tokio::sync::{oneshot};
use axum::http::StatusCode;





pub async fn get_clients(
    State(state): State<ApiState>,
) -> Result<Json<Page<Session>>, StatusCode> {

    let (reply_tx, reply_rx) = oneshot::channel();

    state
        .tx
        .send(AdminCommand::GetClients(reply_tx, 0, 10))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let sessions = reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

   // let page = state.client_service.get_paginated(0, 10);
    Ok(Json(sessions))
}