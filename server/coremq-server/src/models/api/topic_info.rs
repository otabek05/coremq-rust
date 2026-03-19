use serde::{Deserialize, Serialize};

/*
  API response payload for topics (serialized to JSON).
*/
#[derive(Debug, Clone, Serialize)]
pub struct TopicInfo {
    pub topic: String,
    pub subscriber_count: usize,
}

/*
  API request payload for publishing a message (deserialized from JSON).
*/
#[derive(Debug, Deserialize)]
pub struct PublishRequest {
    pub topic: String,
    pub payload: String,
    pub qos: u8,
    pub retain: bool,
}
