pub mod listener;

use serde::{Deserialize, Serialize};

use crate::models::listener::ListenerConfig;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub middleware: Middleware,
    pub mqtt: MqttConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Middleware {
    pub model_path: String,
    pub policy_path: String,
    pub secret: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MqttConfig {
    pub listeners: Vec<ListenerConfig>,
}

