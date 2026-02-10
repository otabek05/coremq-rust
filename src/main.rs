
mod broker;
mod conn_handler;
mod models;
mod enums;
mod brokers;
mod engine;

use std::sync::Arc;

use tokio::{net::TcpListener, sync::Mutex};

use crate::broker::Broker;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let listener = TcpListener::bind("0.0.0.0:1883").await?;
    let broker = Arc::new(Mutex::new(Broker::default()));

    println!("MQTT broker running on port 1883");

    loop {
        let (socket, _) = listener.accept().await?;
        let broker = broker.clone();

        tokio::spawn(async move {
            if let Err(e) = conn_handler::handle_client(socket, broker).await {
                eprintln!("client error: {:?}", e);
            }
        });
    }
}
