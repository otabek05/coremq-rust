use std::sync::Arc;
use tokio::sync::mpsc;

use crate::{
    broker::actions::MqttResponse,
    enums::MqttChannel,
    models::session::Session,
    protocol::{packets::PublishPacket, parser::MqttParser},
    services::{ClientService, TopicService},
};

#[derive(Clone)]
pub struct Engine {
    client_service: Arc<ClientService>,
    topic_service: Arc<TopicService>,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            client_service: Arc::new(ClientService::new()),
            topic_service: Arc::new(TopicService::new()),
        }
    }

    pub async fn handle(
        &self,
        client_id: &str,
        packet: &MqttParser,
        tx: mpsc::Sender<MqttChannel>,
    ) -> MqttResponse {
        match packet {
            MqttParser::Connect(p) => {
                let old_session = self.client_service.remove_client(&p.client_id);

                if let Some(session) = old_session {
                  //  self.topic_service.remove_client(&session.client_id);
                    let _ = session.tx.send(MqttChannel::Disconnect).await;
                }

                self.client_service.add_client(p, tx);

                MqttResponse::ConnAck {
                    session_present: false,
                }
            }

            MqttParser::Disconnect => {
                let _ = tx.send(MqttChannel::Disconnect).await;
                MqttResponse::Disconnect
            }

            MqttParser::Subscribe(p) => {
                self.client_service.add_subscribtion(client_id, p);
               // self.topic_service.subscribe(&p.topic, client_id);

                MqttResponse::SubAck {
                    packet_id: p.packet_id,
                }
            }

            MqttParser::Unsubscribe(p) => {
                self.client_service.remove_subscribtion(client_id, &p.topic);
            //    self.topic_service.unsubscribe(&p.topic, client_id);

                MqttResponse::UnsubAck {
                    packet_id: p.packet_id,
                }
            }

            MqttParser::Publish(p) => {
                self.publish(p.clone()).await;

                if let Some(packet_id) = p.packet_id {
                    return MqttResponse::PubAck { packet_id };
                }

                MqttResponse::None
            }

            MqttParser::PingReq => MqttResponse::PingResp,
        }
    }
/*

    pub async fn drop_client(&mut self, client_id: &str) {
        if let Some(session) = self.client_service.remove_client(client_id) {
            self.topic_service.remove_client(&session.client_id);
        }
    }
*/
    async fn publish(&self, p: PublishPacket) {
        let subscribers = self.topic_service.match_subscribers(&p.topic);
        for client_id in subscribers {
            if let Some(session) = self.client_service.get_session(&client_id) {
                let _ = session.tx.try_send(MqttChannel::Publish(p.clone()));
            }
        }
    }

    pub async fn get_clients(&self) -> Vec<Session> {
        self.client_service.get_all()
    }
}