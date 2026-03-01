use axum::{Json, extract::{Path, State}, http::StatusCode};
use tokio::sync::oneshot;

use crate::{api::api_state::ApiState, engine::AdminCommand, models::{config::ListenerConfig, listener}};

pub async  fn get_listeners(
    State(state): State<ApiState>
) -> Result<Json<Vec<ListenerConfig>>, StatusCode> {
    let (reply_tx, reply_rx) = oneshot::channel();
    state.tx.send(AdminCommand::GetListeners(reply_tx)).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let listeners = reply_rx.await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(listeners))
}

pub async  fn stop_listener(
    Path(port): Path<u16>,
   // Json(payload): Json<listener::StopListener>,
    State(state): State<ApiState>
) -> Result<Json<String>, StatusCode> {
   // let (reply_tx, reply_rx) = oneshot::channel();
    state.tx.send(AdminCommand::StopListener(port)).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(String::from("successfully stopped")))
}