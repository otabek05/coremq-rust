use bytes::BytesMut;
use std::{ collections::{HashMap, HashSet},sync::Arc,};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::{Mutex, RwLock, mpsc},
};

use crate::{
    models::{ client::Session,topic::TopicNode,},
    utils::mqtt_packet::{
        MqttPacket,
        PublishPacket,
        SubscribePacket,
        ConnectPacket,
    },
};

pub type ClientID = String;

#[derive(Clone, Debug)]
pub struct TcpBroker {
    clients: Arc<Mutex<HashMap<ClientID, Session>>>,
    topic_tree: Arc<RwLock<TopicNode>>,
}

impl TcpBroker {
    pub fn new(
        clients: Arc<Mutex<HashMap<ClientID, Session>>>,
        topic_tree: Arc<RwLock<TopicNode>>,
    ) -> Self {
        Self { clients, topic_tree }
    }

    pub async fn handle_receive(&self, mut socket: TcpStream) -> anyhow::Result<()> {
        let (tx, mut rx) = mpsc::channel::<PublishPacket>(32);
        let mut buffer = BytesMut::with_capacity(1024);
        let mut current_client_id: Option<String> = None;

        loop {
            tokio::select! {
                read = socket.read_buf(&mut buffer) => {
                    let n = read?;
                    if n == 0 {
                        break;
                    }

                    while let Some(packet) = MqttPacket::parse_packet(&mut buffer) {
                        self.process_packet(
                            packet,
                            &mut socket,
                            &tx.clone(),
                            &mut current_client_id
                        ).await?;
                    }
                }
                Some(msg) = rx.recv() => {
                    Self::send_publish(&mut socket, msg).await?;
                }
            }
        }

        // Cleanup on disconnect
        if let Some(client_id) = current_client_id {
            let mut clients = self.clients.lock().await;
            clients.remove(&client_id);
        }

        Ok(())
    }

    async fn process_packet(
        &self,
        packet: MqttPacket,
        socket: &mut TcpStream,
        tx: &mpsc::Sender<PublishPacket>,
        current_client_id: &mut Option<String>,
    ) -> anyhow::Result<()> {

        match packet {

            MqttPacket::Connect(p) => {
                self.handle_connect(p, socket, tx, current_client_id).await?;
            }

            MqttPacket::Subscribe(p) => {
                self.handle_subscribe(p, socket, current_client_id).await?;
            }

            MqttPacket::Publish(p) => {
                self.publish(&p).await;
                println!("Publish message topic: {}", p.topic);
            }

            MqttPacket::PingReq => {
                socket.write_all(&[0xD0, 0x00]).await?;
            }

            _ => {
                println!("didnt match none of them")
            }
        }

        Ok(())
    }

    async fn handle_connect(
        &self,
        p: ConnectPacket,
        socket: &mut TcpStream,
        tx: &mpsc::Sender<PublishPacket>,
        current_client_id: &mut Option<String>,
    ) -> anyhow::Result<()> {
        let client_id = p.client_id.clone();
        *current_client_id = Some(client_id.clone());

        let session = Session::new(
            client_id.clone(),
            p.username.unwrap_or_default(),
            p.clean_session,
            tx.clone(),
        );

        {
            let mut clients = self.clients.lock().await;

            if let Some(old) = clients.remove(&client_id) {
                println!("client {} reconnected", client_id);
                drop(old);
            }

            clients.insert(client_id.clone(), session);
        }

        println!("client connected: {}", client_id);
        socket.write_all(&[0x20, 0x02, 0x00, 0x00]).await?;
        Ok(())
    }

    async fn handle_subscribe(
        &self,
        p: SubscribePacket,
        socket: &mut TcpStream,
        current_client_id: &Option<String>,
    ) -> anyhow::Result<()> {

        if let Some(client_id) = current_client_id {
            self.subscribe(&p, client_id.clone()).await;

            println!("client {} subscribed to {}", client_id, p.topic);

            // Basic SUBACK (QoS 0)
            socket.write_all(&[0x90, 0x03, 0x00, 0x01, 0x00]).await?;
        } else {
            println!("Subscribe received before CONNECT");
        }

        Ok(())
    }

    // =========================================================
    // ==================== SUBSCRIBE LOGIC ====================
    // =========================================================

    pub async fn subscribe(&self, req: &SubscribePacket, client_id: String) {

        // Store in client struct
        {
            let mut clients = self.clients.lock().await;
            if let Some(client) = clients.get_mut(&client_id) {
                client.add_subscription(req.clone());
            }
        }

        // Insert into topic tree
        {
            let mut root = self.topic_tree.write().await;
            let mut current = &mut *root;

            for level in req.topic.split('/') {
                current = current
                    .children
                    .entry(level.to_string())
                    .or_insert_with(TopicNode::default);
            }

            current.subscribers.insert(client_id);
        }
    }

    // =========================================================
    // ==================== PUBLISH =============================
    // =========================================================

    pub async fn publish(&self, packet: &PublishPacket) {

        let subscribers = {
            let root = self.topic_tree.read().await;
            let levels: Vec<&str> = packet.topic.split('/').collect();
            let mut result = HashSet::new();

            Self::match_topic(&root, &levels, 0, &mut result);
            result
        };

        for client_id in subscribers {
            let tx_opt = {
                let clients = self.clients.lock().await;
                clients.get(&client_id).map(|c| c.tx.clone())
            };

            if let Some(tx) = tx_opt {
                let _ = tx.send(packet.clone()).await;
            }
        }
    }

    // =========================================================
    // ==================== SEND PUBLISH =======================
    // =========================================================

    async fn send_publish(
        socket: &mut TcpStream,
        msg: PublishPacket,
    ) -> anyhow::Result<()> {

        let mut out = Vec::new();
        out.push(0x30);

        let len = 2 + msg.topic.len() + msg.payload.len();
        out.push(len as u8);

        out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
        out.extend_from_slice(msg.topic.as_bytes());
        out.extend_from_slice(&msg.payload);

        socket.write_all(&out).await?;

        Ok(())
    }

    // =========================================================
    // ==================== TOPIC MATCHING =====================
    // =========================================================

    fn match_topic(
        node: &TopicNode,
        levels: &[&str],
        index: usize,
        result: &mut HashSet<ClientID>,
    ) {
        if index == levels.len() {
            result.extend(node.subscribers.iter().cloned());

            if let Some(hash_child) = node.children.get("#") {
                result.extend(hash_child.subscribers.iter().cloned());
            }

            return;
        }

        let level = levels[index];

        if let Some(child) = node.children.get(level) {
            Self::match_topic(child, levels, index + 1, result);
        }

        if let Some(plus_child) = node.children.get("+") {
            Self::match_topic(plus_child, levels, index + 1, result);
        }

        if let Some(hash_child) = node.children.get("#") {
            result.extend(hash_child.subscribers.iter().cloned());
        }
    }
}
