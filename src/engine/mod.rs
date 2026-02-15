use std::sync::Arc;
use tokio::sync::Mutex;
use crate::models::client::Client;

#[derive(Clone,Debug)]
pub struct Engine {
    pub clients: Arc<Mutex<Vec<Client>>>
}

impl Engine {
    pub fn new() -> Self {
        Engine { clients: Arc::new(Mutex::new(Vec::new())) }
    }


}