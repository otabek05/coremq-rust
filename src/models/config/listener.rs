use serde::{Deserialize, Serialize};

use crate::{enums::protocol::ProtocolType};




#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ListenerConfig {
    pub name: String,
    pub protocol: ProtocolType,
    pub host: String,
    pub port: u16,

    #[serde(default)]
    pub tls: Option<TlsConfig>,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TlsConfig {
    pub cert: String,
    pub key: String,

    #[serde(default)]
    pub ca: Option<String>,
}


#[derive(Clone, Serialize, Deserialize)]
pub struct  StopListener {
    pub port: u16
}