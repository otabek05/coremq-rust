
mod broker;
mod conn_handler;
mod models;
mod enums;
mod brokers;
mod engine;
mod utils;

use tokio::{net::TcpListener};
use crate::brokers::broker::Broker;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let main_engine = engine::Engine::new();
    let ports = vec![1883, 8883];

    for port in ports {
        let addr = format!("0.0.0.0:{}", port);
        let listener = TcpListener::bind(&addr).await?;

        println!("MQTT broker running on {}", addr);

        // Broker should be Arc<Broker>
        let broker = Broker::new(
            main_engine.clients.clone(),
            main_engine.topic_tree.clone(),
        );

        // Store broker safely
        main_engine
            .brokers
            .lock()
            .await
            .push(broker.clone());

        tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((socket, _)) => {
                        let broker = broker.clone();

                        tokio::spawn(async move {
                            if let Err(e) = broker.handle_receive(socket).await {
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