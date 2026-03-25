use axum::{extract::State, response::Json};
use axum::http::StatusCode;
use tokio::sync::oneshot;

use crate::{
    api::api_state::{ApiResponse, ApiState},
    engine::AdminCommand,
    models::topic_info::{TopicInfo, PublishRequest},
    protocol::packets::PublishPacket,
};

/*
  GET /api/v1/topics
  Returns active topics with subscriber counts.
*/
pub async fn get_topics(
    State(state): State<ApiState>,
) -> Result<Json<ApiResponse<Vec<TopicInfo>>>, StatusCode> {
    let (reply_tx, reply_rx) = oneshot::channel();

    state
        .engine
        .send(AdminCommand::GetTopics(reply_tx))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let topics = reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(topics, "successfully fetched topics")))
}

/*
  POST /api/v1/publish
  Publishes a message to a topic via the engine.
*/
pub async fn publish_message(
    State(state): State<ApiState>,
    Json(body): Json<PublishRequest>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let packet_id = match body.qos {
        1 | 2 => Some(state.next_packet_id()),
        _ => None,
    };

    let packet = PublishPacket {
        packet_id,
        topic: body.topic.clone(),
        payload: body.payload.into_bytes(),
        qos: body.qos,
        retain: body.retain,
        dup: false,
    };

    let (reply_tx, reply_rx) = oneshot::channel();

    state
        .engine
        .send(AdminCommand::PublishMessage(packet, reply_tx))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    reply_rx
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(
        body.topic,
        "message published successfully",
    )))
}
