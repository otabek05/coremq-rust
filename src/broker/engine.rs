use std::{ sync::Arc};

use tokio::sync::{Mutex, mpsc};

use crate::{broker::actions::MqttResponse, enums::MqttChannel, protocol::{packets::PublishPacket, parser::MqttParser}, services::{ClientService, TopicService}};


#[derive(Clone)]
pub struct Engine {
    client_service: Arc<Mutex<ClientService>>,
    topic_service: Arc<Mutex<TopicService>>,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            client_service: Arc::new(Mutex::new(ClientService::new())),
            topic_service: Arc::new(Mutex::new(TopicService::new())),
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
                if let Some(session) = self.client_service.lock().await.remove_client(&p.client_id) {
                    self.topic_service.lock().await.remove_client(&session.client_id);
                    let _ = session.tx.send(MqttChannel::Disconnect).await;
                    drop(session);
                }

                self.client_service.lock().await.add_client(&p, tx);
                MqttResponse::ConnAck {session_present: !p.clean_session,}
            }

            MqttParser::Disconnect => {
                 if let Some(session) = self.client_service.lock().await.remove_client(client_id) {
                    self.topic_service.lock().await.remove_client(&session.client_id);
                    let _ = session.tx.send(MqttChannel::Disconnect).await;
                    drop(session);
                }

                MqttResponse::Disconnect
            } 

            MqttParser::Subscribe(p) => {
                self.client_service
                    .lock()
                    .await
                    .add_subscribtion(client_id, &p);
                self.topic_service
                    .lock()
                    .await
                    .subscribe(&p.topic, client_id);
                MqttResponse::SubAck {
                    packet_id: p.packet_id,
                }
            }

            MqttParser::Unsubscribe(p) => {
                self.client_service
                    .lock()
                    .await
                    .remove_subscribtion(client_id, &p.topic);
                self.topic_service
                    .lock()
                    .await
                    .unsubscribe(&p.topic, client_id);
                MqttResponse::UnsubAck {
                    packet_id: p.packet_id,
                }
            }

            MqttParser::Publish(p) => {
                self.publish(p.clone()).await;
                if let Some(packet_id) = p.packet_id {
                   return  MqttResponse::PubAck { packet_id };
                }

                MqttResponse::None
            } 

            MqttParser::PingReq => MqttResponse::PingResp,
        }
    }

    async fn publish(&self, p: PublishPacket) {
        let subscribers = { self.topic_service.lock().await.match_subscribers(&p.topic) };
        for client_id in subscribers {
            let tx_opt = self
                .client_service
                .lock()
                .await
                .get_session(&client_id)
                .map(|s| s.tx.clone());

            if let Some(tx) = tx_opt {
                let _ = tx.send(MqttChannel::Publish(p.clone())).await;
            }
        }
    }
}
