
use tokio::sync::{mpsc, oneshot};
use std::sync::Arc;

pub enum EngineCommand {
    Connect(ConnectPacket, mpsc::Sender<MqttChannel>),
    Disconnect(String),
    Subscribe(SubscribePacket, String),
    Unsubscribe(UnsubscribePacket, String),
    Publish(PublishPacket),
    GetClients(oneshot::Sender<Page<Session>>, usize, usize)
}

use crate::{
    enums::MqttChannel,
    models::{pagination::Page, session::Session},
    protocol::{packets::{ConnectPacket, PublishPacket, SubscribePacket, UnsubscribePacket}, parser::MqttParser},
    services::{ClientService, TopicService},

};

pub struct Engine {
    client_service: Arc<ClientService>,
    topic_service: TopicService,
    rx: mpsc::UnboundedReceiver<EngineCommand>,
}

impl Engine {
    pub fn new(
        client_service: Arc<ClientService>,
        rx: mpsc::UnboundedReceiver<EngineCommand>) -> Self {
        Self {
            client_service,
            topic_service: TopicService::new(),
            rx,
        }
    }

    pub  fn drop_client(&mut self, client_id: &str) {
        if let Some(session) = self.client_service.remove_client(client_id) {
            self.topic_service.remove_client(client_id);
        }
    }

    fn publish(&self, p: PublishPacket) {
        let subscribers = self.topic_service.match_subscribers(&p.topic);
        for client_id in subscribers {
            if let Some(session) = self.client_service.get_session(&client_id) {
                let _ = session.tx.try_send(MqttChannel::Publish(p.clone()));
            }
        }
    }

    pub fn get_clients(&self) -> Vec<Session> {
        self.client_service.get_all()
    }


    pub fn get_paginated(&self, page: usize, size: usize) -> Page<Session> {
      self.client_service.get_paginated(page, size)
    }

}

impl Engine {
   pub async fn run(&mut self) {
        while let Some(cmd) = self.rx.recv().await {
            match cmd {
                EngineCommand::Connect(packet, tx) => {
                    let old_session = self.client_service.remove_client(&packet.client_id);

                    if let Some(session) = old_session {
                        self.topic_service.remove_client(&session.client_id);
                        let _ = session.tx.send(MqttChannel::Disconnect).await;
                    }

                    self.client_service.add_client(&packet, tx);
                }

                EngineCommand::Disconnect(client_id) => {
                    println!("Client removing from engine: {}", client_id);
                    self.drop_client(&client_id);
                }

                EngineCommand::Publish(packet) => {
                    self.publish(packet);
                }

                EngineCommand::Subscribe(packet, client_id) => {
                    self.client_service.add_subscribtion(&client_id, &packet);
                    self.topic_service.subscribe(&packet.topic, &client_id);
                }

                EngineCommand::Unsubscribe(packet, client_id) => {
                    self.client_service.remove_subscribtion(&client_id, &packet.topic);
                    self.topic_service.unsubscribe(&packet.topic,& client_id);
                }

                EngineCommand::GetClients(reply_tx, page, size) => {
                    let clients = self.get_paginated(page, size);
                    let _ = reply_tx.send(clients);
                }
            }
        }
    }
}
