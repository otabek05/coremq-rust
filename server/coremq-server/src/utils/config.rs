use std::fs;
use crate::models::config::Config;

pub fn from_file() -> Result<Config, Box<dyn std::error::Error>> {
    let config_path = std::env::var("COREMQ_CONFIG")
        .unwrap_or_else(|_| "server/coremq-server/config/config.yaml".to_string());
    let content = fs::read_to_string(config_path)?;
    let config = serde_yaml::from_str(&content)?;
    Ok(config)
}