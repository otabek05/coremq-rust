use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub app: AppConfig,
    pub http: HttpConfig,
    pub mqtt: MqttConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub name: String,
    pub env: String,
    pub middleware: Middleware,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpConfig {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MqttConfig {
    pub listeners: Vec<ListenerConfig>,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct Middleware {
    pub model_path: String,
    pub policy_path: String,
    pub secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListenerConfig {
    pub name: String,
    pub protocol: Protocol,
    pub host: String,
    pub port: u16,
    pub auth_type: AuthType,

    #[serde(default)]
    pub tls: Option<TlsConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    Tcp,
    Tls,
    Ws,
    Wss,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuthType {
    None,
    Basic,
    Jwt,
    Mtls,
    ApiKey,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TlsConfig {
    pub cert: String,
    pub key: String,

    #[serde(default)]
    pub ca: Option<String>,
}