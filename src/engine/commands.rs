use tokio::sync::{mpsc, oneshot};

use crate::{
    enums::MqttChannel, 
    models::{pagination::Page, session::Session}, 
    protocol::packets::{ConnectPacket, PublishPacket, SubscribePacket, UnsubscribePacket}
};


pub struct EngineChannels {
    pub connect_rx: mpsc::UnboundedReceiver<ConnectCommand>,
    pub pubsub_rx: mpsc::UnboundedReceiver<PubSubCommand>,
    pub admin_rx: mpsc::UnboundedReceiver<AdminCommand>,
}
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