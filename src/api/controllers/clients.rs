use axum::{response::Json, extract::State};

use crate::{

  api::api_state::ApiState, engine::AdminCommand, models::{config::ListenerConfig, pagination::Page, session::Session}
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

    Ok(Json(sessions))
}

