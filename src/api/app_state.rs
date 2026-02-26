
use tokio::sync::mpsc;
use crate::{ engine::AdminCommand};


#[derive(Clone)]
pub struct ApiState {
    pub tx: mpsc::UnboundedSender<AdminCommand>,
}