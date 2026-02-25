use std::sync::Arc;

use tokio::sync::mpsc;

use crate::{broker::engine::Engine, engine::engine::EngineCommand};


#[derive(Clone)]
pub struct ApiState {
    pub tx: mpsc::UnboundedSender<EngineCommand>
    //pub engine: Arc<Engine>
}