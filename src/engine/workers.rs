use std::{net::SocketAddr, sync::Arc};

use axum::{Router, routing::get};
use tokio::{net::TcpListener, sync::watch, task::JoinHandle};
use tower_http::cors::CorsLayer;

use crate::{
    engine::Engine,
    models::config::{ Protocol},
    transport::{ProtocolState, tcp::tcp_connection, ws::ws_handler},
};

impl Engine {
    async fn tcp_worker(port: u16, state: Arc<ProtocolState>, mut stop_rx: watch::Receiver<bool>) {
        let addr = format!("0.0.0.0:{}", port);
        let listener = TcpListener::bind(addr).await.unwrap();
        println!("MQTT TCP listening on port {}", port);

        loop {
            tokio::select! {
                res = listener.accept() => {
                    let (socket, addr) = res.unwrap();
                    let state_clone = state.clone();
                    tokio::spawn(async move {
                        if let Err(e) = tcp_connection(socket, state_clone).await {
                            println!("TCP connection error: {}", e);
                        }
                    });
                }
                _ = stop_rx.changed() => {
                    println!("Stopping TCP listener on port {}", port);
                    break;
                }
            }
        }
    }

    async fn ws_worker(port: u16, state: Arc<ProtocolState>, mut stop_rx: watch::Receiver<bool>) {
        let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
        let app = Router::new()
            .route("/mqtt", get(ws_handler))
            .with_state(state.clone())
            .layer(CorsLayer::permissive());

        let server = axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app);
        println!("MQTT WS listening on port {}", port);

        tokio::select! {
            res = server => {
                if let Err(e) = res {
                    eprintln!("WS server error on port {}: {}", port, e);
                }
            }
            _ = stop_rx.changed() => {
                println!("Stopping WS listener on port {}", port);

            }
        }
    }

    pub async fn start_listeners(&mut self, state: Arc<ProtocolState>) {
        for port_cfg in &self.config.mqtt.listeners {
            if self.listeners.contains_key(&port_cfg.port) {
                continue;
            }

            let (tx, rx) = watch::channel(false);
            let state_clone = state.clone();
            let port_num = port_cfg.port;

            // spawn the worker
            let handle: JoinHandle<()> = match port_cfg.protocol {
                Protocol::Tcp => tokio::spawn(async move {
                    Engine::tcp_worker(port_num, state_clone, rx).await;
                }),
                Protocol::Ws => tokio::spawn(async move {
                    Engine::ws_worker(port_num, state_clone, rx).await;
                }),
                _ => continue, 
            };

            self.listeners.insert(port_num, (handle, tx));
        }
    }

    pub async fn stop_listener(&mut self, port: u16) {
        if let Some((handle, stop_tx)) = self.listeners.remove(&port) {
            stop_tx.send(true).unwrap();
            handle.await.unwrap();
            println!("Stopped listener on port {}", port);
        }
    }
}
