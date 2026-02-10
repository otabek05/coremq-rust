use std::{net::SocketAddr, time::{Duration, SystemTime}};


pub type Topic = String;


pub struct Subscription {
    pub topic:Topic,
    pub qos: u8,
    pub subscribed_at: SystemTime
}

pub struct WillMessage{
    pub topic:Topic,
    pub payload: Vec<u8>,
    pub qos: u8,
    pub retain: bool
}


pub struct Client {
    pub client_id :String, 
    pub username: String, 
    pub remote_addr: SocketAddr,
    pub connected_at: SystemTime,
    pub last_activity: SystemTime,
    pub keep_alive: Duration,
    pub clean_session: bool,

}