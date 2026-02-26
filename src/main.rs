mod engine;
mod protocol;
mod services;
mod storage;
mod transport;
mod enums;
mod models;
mod api;
mod utils;



use std::{net::SocketAddr, sync::Arc};
use tokio::{net::TcpListener, sync::mpsc};
use axum::{Router, routing::get};
use tower_http::cors::CorsLayer;

use crate::{
    api::{app_state::ApiState, router::RouterHandler}, 
    engine::engine::{AdminCommand, ConnectCommand, Engine, EngineChannels, PubSubCommand},   
    services::ClientService, transport::{ProtocolState, tcp::tcp_connection, ws::ws_handler}
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pid = std::process::id();
    println!("Current process ID: {}", pid);

    let client_service = Arc::new(ClientService::new());

    // Create three channels
    let (connect_tx, connect_rx) = mpsc::unbounded_channel::<ConnectCommand>();
    let (pubsub_tx, pubsub_rx) = mpsc::unbounded_channel::<PubSubCommand>();
    let (admin_tx, admin_rx) = mpsc::unbounded_channel::<AdminCommand>();

    let channels = EngineChannels {
        connect_rx,
        pubsub_rx,
        admin_rx,
    };

    // Spawn engine
    let mut engine = Engine::new(client_service.clone(), channels);
    tokio::spawn(async move {
        engine.run().await;
    });

    let engine_channels = Arc::new(
        ProtocolState {
            connect_tx: connect_tx.clone(),
            pubsub_tx: pubsub_tx.clone(),
        });
    
    let mqtt_engine_channels = engine_channels.clone();
    tokio::spawn(async move {
        start_mqtt_server(mqtt_engine_channels).await;
    });


    tokio::spawn(async move {
        let app = Router::new()
        .route("/mqtt", get(ws_handler))
        .with_state(engine_channels.clone())
        .layer(CorsLayer::permissive());
    
        let addr = SocketAddr::from(([0, 0, 0, 0], 8083));
        println!("Mqtt over WS running {}", addr);
        axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
            .await
            .unwrap();
    });

    let state = ApiState{
        tx: admin_tx.clone(),
    };

    let router = RouterHandler::new();
    let addr = format!("{}:{}", "localhost", 18083);
    let listener = TcpListener::bind(addr.clone()).await?;
    println!("Admin Panel running on {}", addr);

    axum::serve(listener, router.create_router(state)).await.unwrap();

    Ok(())
}

async fn start_mqtt_server(
   state: Arc<ProtocolState>
) {
    let listener = TcpListener::bind("0.0.0.0:1883")
        .await
        .expect("Failed to bind 1883");

    println!("MQTT running on port 1883");
    loop {
        let (socket, _addr) = listener.accept().await.unwrap();
         let state_for_task = state.clone();
        tokio::spawn(async move {
        
            if let Err(err) = tcp_connection(socket, state_for_task).await {
                println!("Socket err: {}", err);
            }
        });
    }
}