use bytes::{Buf, BytesMut};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::{Mutex, mpsc},
};

use crate::{broker::parser::*, utils::mqtt_packet::MqttPacket};

use crate::{
    broker::Publish,
    models::client::{Client, Subscription, WillMessage},
};

type ClientID = String;
type Topic = String;

pub struct Broker {
    clients: Arc<Mutex<HashMap<ClientID, Client>>>,
    subscribers: Arc<Mutex<HashMap<Topic, HashSet<ClientID>>>>,
}

impl Broker {
    pub fn new(
        clients: Arc<Mutex<HashMap<ClientID, Client>>>,
        subscribers: Arc<Mutex<HashMap<Topic, HashSet<String>>>>,
    ) -> Self {
        Broker {
            clients,
            subscribers,
        }
    }

    pub async fn subscribe(&self, req: &Subscription, client_id: String) {
        {
            let mut clients = self.clients.lock().await;
            if let Some(client) = clients.get_mut(&client_id) {
                let mut subs = client.subscriptions.lock().await;
                if !subs.iter().any(|s| s.topic == req.topic) {
                    subs.push(req.clone());
                }
            }
        }

        {
            let mut subs = self.subscribers.lock().await;
            subs.entry(req.topic.clone())
                .or_insert_with(HashSet::new)
                .insert(client_id);
        }
    }

    pub async fn publish(&self, packet: &WillMessage) {
        let subs_ids: Vec<ClientID> = {
            let subs = self.subscribers.lock().await;
            match subs.get(&packet.topic) {
                Some(set) => set.iter().cloned().collect(),
                None => return,
            }
        };

        for client_id in subs_ids {
            let tx_opt = {
                let clients = self.clients.lock().await;
                clients.get(&client_id).map(|m| m.tx.clone())
            };

            if let Some(tx) = tx_opt {
                let _ = tx.send(packet.clone()).await;
            }
        }
    }

    pub async fn handle_receive(&self, mut socket: TcpStream) -> anyhow::Result<()> {
        let (tx, mut rx) = mpsc::channel::<Publish>(32);
        let mut buffer = BytesMut::with_capacity(1024);

        loop {
            tokio::select! {
                        n = socket.read_buf(&mut buffer) => {
                let n = n?;
                if n == 0 {
                    break;
                }

                while let Some(packet) = MqttPacket::parse_packet(&mut buffer) {

                    match packet {

                        MqttPacket::Connect(p) => {
                            println!("client connected: {}", p.client_id);

                            // CONNACK
                            socket.write_all(&[0x20, 0x02, 0x00, 0x00]).await?;
                        }

                        MqttPacket::Subscribe(_p) => {

                            println!("client has been subscribed");
                            socket.write_all(&[0x90, 0x03, 0x00, 0x01, 0x00]).await?;
                        }

                        MqttPacket::Publish(p) => {
                            println!("Publish message topic: {}", p.topic);
                        }

                        MqttPacket::PingReq => {
                            socket.write_all(&[0xD0, 0x00]).await?;
                        }

                        _ => {}
                    }
                }
            }


                        Some(msg) = rx.recv() => {
                            let mut out = Vec::new();
                            out.push(0x30);

                            let len = 2 + msg.topic.len() + msg.payload.len();
                            out.push(len as u8);

                            out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
                            out.extend_from_slice(msg.topic.as_bytes());
                            out.extend_from_slice(&msg.payload);

                            socket.write_all(&out).await?;
                        }
                    }
        }

        Ok(())
    }
}
