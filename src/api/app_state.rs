use std::sync::Arc;

use tokio::sync::mpsc;

use crate::{broker::engine::Engine, engine::engine::EngineCommand, services::ClientService};


#[derive(Clone)]
pub struct ApiState {
    pub tx: mpsc::UnboundedSender<EngineCommand>,
    pub client_service: Arc<ClientService>
    //pub engine: Arc<Engine>
}