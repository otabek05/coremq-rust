use std::{collections::{HashMap}, sync::Arc};
use tokio::sync::{Mutex, RwLock};
use crate::{brokers::tcp_broker::{TcpBroker, ClientID}, models::{client::{ Session}, topic::TopicNode}};

#[derive(Clone,Debug)]
pub struct Engine {
  pub clients: Arc<Mutex<HashMap<ClientID, Session>>>,
  pub topic_tree: Arc<RwLock<TopicNode>>,
  pub brokers: Arc<Mutex<Vec<TcpBroker>>>
}

impl Engine {
    pub fn new() -> Self {
        Engine { 
            clients: Arc::new(Mutex::new(HashMap::new())),
            topic_tree: Arc::new(RwLock::new(TopicNode::default())),
            brokers: Arc::new(Mutex::new(Vec::new()))
         }
    }

}