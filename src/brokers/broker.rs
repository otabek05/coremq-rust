use std::{collections::{HashMap, HashSet }, sync::Arc, time::SystemTime};

use tokio::sync::Mutex;

use crate::models::client::{Client, Subscription, WillMessage};

type ClientID = String;
type Topic = String;

pub struct Broker {
    clients: Arc<Mutex<HashMap<ClientID, Client>>>, 
    subscribers: Arc<Mutex<HashMap<Topic, HashSet<ClientID>>>>
}


impl Broker {
    pub fn new(
        clients: Arc<Mutex<HashMap<ClientID, Client>>>, 
        subscribers:Arc<Mutex<HashMap<Topic, HashSet<String>>>> ) -> Self {
        Broker { clients , subscribers}
    }

    pub async  fn subscribe(&self, req: &Subscription, client_id: String) {
        
        {
            let mut  clients = self.clients.lock().await;
            if let  Some(client) = clients.get_mut(&client_id) {
                let mut subs = client.subscriptions.lock().await;
                if !subs.iter().any(|s| s.topic == req.topic) {
                    subs.push(req.clone());
                } 
            }else {
                return
            }
        }

        {
           let mut subs = self.subscribers.lock().await;
           subs.entry(req.topic.clone()).or_insert_with(HashSet::new).insert(client_id);
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
}
