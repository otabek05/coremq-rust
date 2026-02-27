use std::fs;

use crate::models::config::Config;

pub fn from_file() -> Option<Config> {
    let content = fs::read_to_string("config/config.yaml").unwrap();
    serde_yaml::from_str(&content).unwrap()
}