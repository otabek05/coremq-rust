

use tokio::sync::{mpsc, oneshot};
use std::sync::Arc;

use crate::{
    enums::MqttChannel,
    models::{pagination::Page, session::Session},
    protocol::packets::{ConnectPacket, PublishPacket, SubscribePacket, UnsubscribePacket},
    services::{ClientService, TopicService},
};

pub enum ConnectCommand {
    Connect(ConnectPacket, mpsc::Sender<MqttChannel>),
    Disconnect(String),
}

pub enum PubSubCommand {
    Subscribe(SubscribePacket, String),
    Unsubscribe(UnsubscribePacket, String),
    Publish(PublishPacket),
}

pub enum AdminCommand {
    GetClients(oneshot::Sender<Page<Session>>, usize, usize),
}

pub struct EngineChannels {
    pub connect_rx: mpsc::UnboundedReceiver<ConnectCommand>,
    pub pubsub_rx: mpsc::UnboundedReceiver<PubSubCommand>,
    pub admin_rx: mpsc::UnboundedReceiver<AdminCommand>,
}

pub struct Engine {
    client_service: Arc<ClientService>,
    topic_service: TopicService,
    channels: EngineChannels,
}

impl Engine {
    pub fn new(
        client_service: Arc<ClientService>,
        channels: EngineChannels,
    ) -> Self {
        Self {
            client_service,
            topic_service: TopicService::new(),
            channels,
        }
    }

    pub fn drop_client(&mut self, client_id: &str) {
        if let Some(_) = self.client_service.remove_client(client_id) {
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

    pub fn get_paginated(&self, page: usize, size: usize) -> Page<Session> {
        self.client_service.get_paginated(page, size)
    }

    pub async fn run(&mut self) {
        loop {
            tokio::select! {
                Some(cmd) = self.channels.connect_rx.recv() => {
                    match cmd {
                        ConnectCommand::Connect(packet, tx) => {
                            let old_session = self.client_service.remove_client(&packet.client_id);
                            if let Some(session) = old_session {
                                self.topic_service.remove_client(&session.client_id);
                                let _ = session.tx.send(MqttChannel::Disconnect).await;
                            }

                            println!("Clinet connected: {:?}", packet);

                            self.client_service.add_client(&packet, tx);
                        }
                        ConnectCommand::Disconnect(client_id) => {
                         //   println!("Client removing from engine: {}", client_id);
                            self.drop_client(&client_id);
                        }
                    }
                }

                Some(cmd) = self.channels.pubsub_rx.recv() => {
                    match cmd {
                        PubSubCommand::Subscribe(packet, client_id) => {
                            self.client_service.add_subscribtion(&client_id, &packet);
                            self.topic_service.subscribe(&packet.topic, &client_id);
                        }
                        PubSubCommand::Unsubscribe(packet, client_id) => {
                            self.client_service.remove_subscribtion(&client_id, &packet.topic);
                            self.topic_service.unsubscribe(&packet.topic, &client_id);
                        }
                        PubSubCommand::Publish(packet) => {
                            self.publish(packet);
                        }
                    }
                }

                Some(cmd) = self.channels.admin_rx.recv() => {
                    match cmd {
                        AdminCommand::GetClients(reply_tx, page, size) => {
                            let clients = self.get_paginated(page, size);
                            let _ = reply_tx.send(clients);
                        }
                    }
                }
            }
        }
    }
}
