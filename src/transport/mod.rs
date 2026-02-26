use tokio::sync::mpsc;

use crate::engine::{ConnectCommand, PubSubCommand};

pub mod ws;
pub mod tcp;

pub struct ProtocolState {
    pub connect_tx: mpsc::UnboundedSender<ConnectCommand>,
    pub pubsub_tx: mpsc::UnboundedSender<PubSubCommand>,
}