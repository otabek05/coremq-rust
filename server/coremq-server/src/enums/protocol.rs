use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ProtocolType {
    Tcp,
    Tls,
    Ws,
    Wss,
}

impl ProtocolType {
    pub fn as_str(&self) -> &'static str  {
        match self {
            ProtocolType::Tcp => "tcp",
            ProtocolType::Tls => "tls",
            ProtocolType::Ws => "ws",
            ProtocolType::Wss => "wss",
        }
    }



}