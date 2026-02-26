use axum::{response::Json, extract::State};

use crate::{
     engine::engine::EngineCommand,
    api::app_state::ApiState, models::{pagination::Page, session::Session}
};

use tokio::sync::{oneshot};
use axum::http::StatusCode;

/*

pub async fn list(State(state): State<ApiState> ) -> Json<Vec<Session>> {
    let clients = state.engine.get_clients().await;
    Json(clients)
}
*/



pub async fn get_clients(
    State(state): State<ApiState>,
) -> Result<Json<Page<Session>>, StatusCode> {

 //   let (reply_tx, reply_rx) = oneshot::channel();

    /*
     
    // Send command to engine
    state
        .tx
        .send(EngineCommand::GetClients(reply_tx, 0, 10))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Await engine response
    let sessions = reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
*/
    let page = state.client_service.get_paginated(0, 10);
    Ok(Json(page))
}