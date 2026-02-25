use axum::{response::Json, extract::State};

use crate::{api::app_state::ApiState, engine::engine::EngineCommand, models::session::Session};

/*

pub async fn list(State(state): State<ApiState> ) -> Json<Vec<Session>> {
    let clients = state.engine.get_clients().await;
    Json(clients)
}
*/

use tokio::sync::{mpsc, oneshot};

pub async fn get_clients(
    State(state): State<ApiState>,
) -> Json<Vec<String>> {
    let (reply_tx, reply_rx) = oneshot::channel();

    state.tx.send(EngineCommand::GetClients(reply_tx)).unwrap();

    let sessions = reply_rx.await.unwrap();

    // Return only client IDs for example
    let client_ids = sessions
        .into_iter()
        .map(|s| s.client_id)
        .collect();

    Json(client_ids)
}