

use dashmap::DashMap;
use tokio::sync::mpsc;

use crate::{
    enums::MqttChannel,
    models::session::Session,
    protocol::packets::{ConnectPacket, SubscribePacket},
};

pub struct ClientService {
    clients: DashMap<String, Session>,
}

impl ClientService {
    pub fn new() -> Self {
        Self {
            clients: DashMap::new(),
        }
    }

    pub fn get_all(&self) -> Vec<Session> {
        self.clients.iter().map(|r| r.value().clone()).collect()
    }

    pub fn add_client(
        &self,
        packet: &ConnectPacket,
        tx: mpsc::Sender<MqttChannel>,
    ) {
        let session = Session::new(
            packet.client_id.clone(),
            packet.username.clone().unwrap_or_default(),
            packet.clean_session,
            tx,
        );

        self.clients.insert(packet.client_id.clone(), session);
    }

    pub fn remove_client(&self, client_id: &str) -> Option<Session> {
        self.clients.remove(client_id).map(|(_, v)| v)
    }

    pub fn get_session(&self, key: &str) -> Option<Session> {
        self.clients.get(key).map(|r| r.value().clone())
    }

    pub fn add_subscribtion(
        &self,
        client_id: &str,
        sub: &SubscribePacket,
    ) {
        if let Some(mut session) = self.clients.get_mut(client_id) {
            session.add_subscription(sub.clone());
        }
    }

    pub fn remove_subscribtion(
        &self,
        client_id: &str,
        topic: &str,
    ) {
        if let Some(mut session) = self.clients.get_mut(client_id) {
            session.remove_subscription(topic);
        }
    }
}