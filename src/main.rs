mod engine;
mod broker;
mod protocol;
mod services;
mod storage;
mod transport;
mod enums;
mod models;
mod api;
mod utils;


use axum::{Router, routing::get};
use tower_http::cors::CorsLayer;
use std::{ net::SocketAddr, sync::Arc};
use tokio::{net::TcpListener, sync::mpsc};

use crate::{api::{app_state::ApiState, router::RouterHandler}, engine::engine::{Engine, EngineCommand}, transport::{tcp::tcp_connection, tcp_connection}};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pid = std::process::id();
    println!("Current process ID: {}", pid);

    let (tx, rx) = mpsc::unbounded_channel::<EngineCommand>();

    let mut engine = Engine::new(rx);
    tokio::spawn(async move {
        engine.run().await;
    });

    let tx_mqtt = tx.clone();
   // let tx_http = tx.clone();

     tokio::spawn(async move {
        start_mqtt_server(tx_mqtt).await;
    });

    let state = ApiState{tx: tx.clone()};
    let router  = RouterHandler::new();
    let addr = format!("{}:{}", "localhost", 18083);
    let listener = TcpListener::bind(addr.clone()).await.expect("Failed to bind address");
    println!("Admin Pannel running on {}", addr);
    axum::serve(listener, router.create_router(state)).await.unwrap();


    /*
    
    
    let engine = Arc::new(Engine::new());
    let ports = vec![1883, 8883];

    for port in ports {
        let addr = format!("0.0.0.0:{}", port);
        let listener = TcpListener::bind(&addr).await?;
        println!("MQTT over TCP/TLS running on {}", addr);
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
        println!("Mqtt over WS running {}", addr);
        axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
            .await
            .unwrap();
    });


    let state = ApiState{engine: engine.clone()};
    let router  = RouterHandler::new();
    let addr = format!("{}:{}", "localhost", 18083);
    let listener = TcpListener::bind(addr.clone()).await.expect("Failed to bind address");
    println!("Admin Pannel running on {}", addr);
    axum::serve(listener, router.create_router(state)).await.unwrap();
*/
    Ok(())
}


async fn start_mqtt_server(tx: mpsc::UnboundedSender<EngineCommand>) {
    let listener = TcpListener::bind("0.0.0.0:1883")
        .await
        .expect("Failed to bind 1883");

    println!("MQTT running on port 1883");

    loop {
        let (socket, addr) = listener.accept().await.unwrap();
        let tx_clone = tx.clone();

        tokio::spawn(async move {
            println!("New MQTT connection: {:?}", addr);
           match tcp_connection(socket, tx_clone).await {
               Ok(()) => {},
               Err(err) => {
                 println!("Socket err: {}", err )
               }
           } 
            
        });
    }
}