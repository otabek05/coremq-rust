use std::fs;
use crate::models::config::Config;

pub fn from_file() -> Result<Config, Box<dyn std::error::Error>> {
    let content = fs::read_to_string("config/config.yaml")?;
    let config = serde_yaml::from_str(&content)?;
    Ok(config)
}