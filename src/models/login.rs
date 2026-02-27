use serde::{Deserialize, Serialize};



#[derive(Serialize, Deserialize)]
pub struct Token {
    pub access_token:String,
    pub refresh_token:String,
}



#[derive(Serialize, Deserialize)]
pub struct Login {
    pub username: String, 
    pub password: String
}