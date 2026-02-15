use std::{net::SocketAddr, sync::Arc, time::{Duration, SystemTime}};

use tokio::sync::{Mutex, mpsc};

#[derive(Debug, Clone)]
pub struct Subscription {
    pub topic:String,
    pub qos: u8,
    pub subscribed_at: SystemTime
}

#[derive(Clone,  Debug)]
pub struct WillMessage{
    pub topic:String,
    pub payload: Vec<u8>,
    pub qos: u8,
    pub retain: bool
}

#[derive(Debug, Clone)]
pub struct Client {
    pub client_id :String, 
    pub username: String, 
    pub remote_addr: SocketAddr,
    pub connected_at: SystemTime,
    pub last_activity: SystemTime,
    pub listener: SocketAddr,
    pub keep_alive: Duration,
    pub clean_session: bool,
    pub subscriptions: Arc<Mutex<Vec<Subscription>>>,
    pub tx: mpsc::Sender<WillMessage>

}