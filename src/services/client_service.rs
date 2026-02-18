use std::{collections::HashMap};
use tokio::sync::mpsc;
use crate::{enums::MqttChannel, models::session::Session, protocol::packets::{ConnectPacket,  SubscribePacket}};

pub struct ClientService {
    clients: HashMap<String, Session>
}


impl ClientService {
    pub fn new() -> Self {
        Self { clients: HashMap::new() }
    }


    pub  fn add_client(&mut self, packet: &ConnectPacket, tx: mpsc::Sender<MqttChannel>) {
        let session = Session::new(
            packet.client_id.clone(), 
            packet.username.clone().unwrap_or_default(), 
            packet.clean_session, 
            tx);
        self.clients.insert(packet.client_id.clone().to_string(), session);
    }

    pub fn remove_client(&mut self, client_id:&str) -> Option<Session> {
        self.clients.remove(client_id)
    }

    pub fn get_session(&mut self, key:&str) -> Option<&mut Session> {
        self.clients.get_mut(key)
    }

    pub fn add_subscribtion(&mut self, client_id: &str, sub: &SubscribePacket) {
      if let Some(session) = self.clients.get_mut(client_id) {
        session.add_subscription(sub.clone());
      }
    }

    pub fn remove_subscribtion(&mut self, client_id:&str, topic: &str) {
        if let  Some(session) = self.clients.get_mut(client_id) {
            session.remove_subscription(topic);
        }
    }


}