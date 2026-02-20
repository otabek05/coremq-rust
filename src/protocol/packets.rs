

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use crate::utils::format_time::format_datetime;
#[derive(Debug, Clone)]
pub struct ConnectPacket {
    pub client_id: String,
    pub keep_alive: u16,
    pub clean_session: bool,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone)]
pub struct PublishPacket {
    pub packet_id: Option<u16>, 
    pub topic: String,
    pub payload: Vec<u8>,
    pub qos: u8,
    pub retain: bool,
    pub dup: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscribePacket {
    pub packet_id: u16,
    pub topic: String,
    pub qos: u8,

    #[serde(serialize_with = "format_datetime")]
    pub subscribed_at: DateTime<Local>
}

#[derive(Debug, Clone)]
pub struct UnsubscribePacket {
    pub packet_id: u16,
    pub topic:String
}