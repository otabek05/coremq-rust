
mod broker;
mod protocol;
mod services;
mod storage;
mod transport;
mod enums;
mod models;
mod api;
mod utils;

use crate::{
    api::{app_state::ApiState, router::RouterHandler}, broker::engine::Engine, transport::{tcp_connection::handle_connection, ws_connection::ws_handler}
};
use axum::{Router, routing::get};
use tower_http::cors::CorsLayer;
use std::{ net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;

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
                            if let Err(e) = handle_connection(socket, engine_port).await {
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

    let engine_for_ws = engine.clone();
    tokio::spawn(async move {
        let app = Router::new()
        .route("/mqtt", get(ws_handler))
        .with_state(engine_for_ws)
        .layer(CorsLayer::permissive());
    
        let addr = SocketAddr::from(([0, 0, 0, 0], 8083));
        println!("Listening on {}", addr);
        axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
            .await
            .unwrap();
    });


    let state = ApiState{engine: engine.clone()};
    let router  = RouterHandler::new();
    let addr = format!("{}:{}", "localhost", 18083);
    let listener = TcpListener::bind(addr).await.expect("Failed to bind address");
    axum::serve(listener, router.create_router(state)).await.unwrap();
   // tokio::signal::ctrl_c().await?;
   // println!("Shutting down...");

    Ok(())
}
