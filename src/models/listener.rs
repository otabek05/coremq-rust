use serde::{Deserialize, Serialize};


#[derive(Clone, Serialize, Deserialize)]
pub struct  StopListener {
    pub port: u16
}