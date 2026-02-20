use std::sync::Arc;

use crate::broker::engine::Engine;


#[derive(Clone)]
pub struct ApiState {
    pub engine: Arc<Engine>
}