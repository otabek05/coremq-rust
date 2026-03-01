mod api;
mod engine;
mod enums;
mod models;
mod pkg;
mod protocol;
mod services;
mod storage;
mod transport;
mod utils;

use axum::{Router, routing::get};
use std::{net::SocketAddr, sync::Arc};
use tokio::{net::TcpListener, sync::mpsc};

use crate::{
    api::{api_state::ApiState, router::RouterHandler}, engine::{AdminCommand, ConnectCommand, Engine, EngineChannels, PubSubCommand}, services::{ClientService, jwt_service::{self, JwtService}}, transport::{ProtocolState, tcp::tcp_connection, ws::ws_handler}
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pid = std::process::id();
    println!("Current process ID: {}", pid);

    let config = match utils::config::from_file() {
        Ok(cfg) => cfg,
        Err(e) => panic!("Failed to load config: {}", e)
    };

    let enforcer = match pkg::enforcer::new(config.middleware.clone()).await {
        Ok(enforcer) => enforcer,
        Err(e) => { panic!("Failed to create enforcer: {}", e)}
    };

    let client_service = Arc::new(ClientService::new());
    let jwt_service = Arc::new(JwtService::new(&config.middleware));
    let enforcer = Arc::new(enforcer);

    let (connect_tx, connect_rx) = mpsc::unbounded_channel::<ConnectCommand>();
    let (pubsub_tx, pubsub_rx) = mpsc::unbounded_channel::<PubSubCommand>();
    let (admin_tx, admin_rx) = mpsc::unbounded_channel::<AdminCommand>();

    let channels = EngineChannels {
        connect_rx,
        pubsub_rx,
        admin_rx,
    };

     let engine_channels = Arc::new(ProtocolState {
        connect_tx: connect_tx.clone(),
        pubsub_tx: pubsub_tx.clone(),
    });

    let mut engine = Engine::new(client_service.clone(), config,  channels);
    engine.start_listeners(engine_channels.clone()).await;

    tokio::spawn(async move {
        engine.run().await;
    });

    let state = ApiState {
        jwt_service: jwt_service.clone(),
        enforcer: enforcer.clone(),
        tx: admin_tx.clone(),
    };

    let router = RouterHandler::new();
    let addr = format!("{}:{}", "localhost", 18083);
    let listener = TcpListener::bind(addr.clone()).await?;
    println!("Admin Panel running on {}", addr);

    axum::serve(listener, router.create_router(state))
        .await
        .unwrap();

    Ok(())
}