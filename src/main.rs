
mod enums;
mod models;

mod broker;
mod protocol;
mod services;
mod storage;
mod transport;

use std::sync::Arc;

use tokio::net::TcpListener;

use crate::{broker::engine::Engine, transport::connection::handle_connection};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let engine = Arc::new(Engine::new());
    let ports = vec![1883, 8883];

    for port in ports {
        let addr = format!("0.0.0.0:{}", port);
        let listener = TcpListener::bind(&addr).await?;
        println!("MQTT broker running on {}", addr);
        let engine_for_listener = engine.clone();

        tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((socket, _)) => {
                        let engine_port = engine_for_listener.clone();
                        tokio::spawn(async move {
                            if let Err(e) =  handle_connection(socket, engine_port).await {
                                eprintln!("client error: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        eprintln!("accept error on {}: {}", addr, e);
                        break;
                    }
                }
            }
        });
    }

    // Wait until Ctrl+C
    tokio::signal::ctrl_c().await?;
    println!("Shutting down...");

    Ok(())
}
