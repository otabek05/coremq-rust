use axum::{response::Json, extract::State};

use crate::{api::app_state::ApiState, models::session::Session};


pub async fn list(State(state): State<ApiState> ) -> Json<Vec<Session>> {
    let clients = state.engine.get_clients().await;
    Json(clients)
}