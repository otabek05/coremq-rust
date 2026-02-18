use std::{ time::{ SystemTime}};
use std::collections::HashMap;

use tokio::sync::{ mpsc};

use crate::{enums::MqttChannel, protocol::packets::{ SubscribePacket}};


#[derive(Debug)]
pub struct Session {
    pub client_id: String,
    pub username: String,
    pub clean_session: bool,
    pub connected_at: SystemTime,
    pub subscriptions: HashMap<String, SubscribePacket>,
    pub tx: mpsc::Sender<MqttChannel>,
}

impl Session {
    pub fn new(
        client_id: String,
        username: String,
        clean_session: bool,
        tx: mpsc::Sender<MqttChannel>,
    ) -> Self {
        Self {
            client_id,
            username,
            clean_session,
            connected_at: SystemTime::now(),
            subscriptions: HashMap::new(),
            tx,
        }
    }

    pub fn add_subscription(&mut self, sub: SubscribePacket) {
        self.subscriptions.insert(sub.topic.clone(), sub);
    }

    pub fn remove_subscription(&mut self, topic: &str) {
        self.subscriptions.remove(topic);
    }
}
