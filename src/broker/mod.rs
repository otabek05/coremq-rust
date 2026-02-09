pub mod parser;

use std::collections::HashMap;
use tokio::sync::mpsc;


pub type Topic = String;

#[derive(Clone, Debug)]
pub struct Publish {
   pub topic: String,
   pub payload: Vec<u8>,
}

#[derive(Default)]
pub struct Broker {
    subscribers: HashMap<Topic, Vec<mpsc::Sender<Publish>>>,
}

impl Broker {
    pub fn subscribe(&mut self, topic: String, tx: mpsc::Sender<Publish>) {
        self.subscribers.entry(topic).or_default().push(tx);
    }

    pub async fn publish(&mut self, msg: Publish) {
        if let Some(subs) = self.subscribers.get_mut(&msg.topic) {
            subs.retain(|tx| tx.try_send(msg.clone()).is_ok());
        }
    }
}