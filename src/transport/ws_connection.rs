use std::sync::Arc;

use axum::{
    extract::{
        State, WebSocketUpgrade, ws::{Message, WebSocket}
    },
    response::IntoResponse,
};
use bytes::BytesMut;
use futures_util::{stream::SplitSink, SinkExt, StreamExt};
use tokio::sync::mpsc;

use crate::{
    broker::engine::Engine, enums::MqttChannel, protocol::{encoder::{encode_publish}, packets::PublishPacket, parser::MqttParser}
};

pub async fn ws_handler(ws: WebSocketUpgrade,  State(engine): State<Arc<Engine>>) -> impl IntoResponse {
   ws.protocols(["mqtt"])
        .on_upgrade(move |socket| handle_socket(socket, engine))
}

async fn handle_socket(socket: WebSocket, engine: Arc<Engine>,) {
    println!("Client connected via WebSocket");

    let (tx, mut rx) = mpsc::channel::<MqttChannel>(32);
    let (mut sender, mut receiver) = socket.split();

    let mut buffer = BytesMut::with_capacity(1024);
    let mut client_id = String::new();

    loop {
        tokio::select! {

            Some(result) = receiver.next() => {
                match result {
                    Ok(msg) => {
                        match msg {
                            Message::Binary(data) => {
                                buffer.extend_from_slice(&data);
                                while let Some(packet) = MqttParser::parse_packet(&mut buffer) {
                                     if let MqttParser::Connect(ref p) = packet {
                                         client_id = p.client_id.clone();
                                     }

                                     let action = engine.handle(&client_id, &packet, tx.clone()).await;
                                     let _ = action.send_ws(&mut sender).await;
                                }
                            }

                            Message::Close(_) => {
                                println!("WS client disconnected");
                                break;
                            }

                            _ => {}
                        }
                    }

                    Err(e) => {
                        println!("WebSocket error: {:?}", e);
                        break;
                    }
                }
            }

            channel_msg = rx.recv() => {
                match channel_msg {
                    Some(MqttChannel::Publish(packet)) => {
                        if let Err(e) = publish_ws(&mut sender, packet).await {
                            println!("Publish WS error: {:?}", e);
                            break;
                        }
                    }

                    Some(MqttChannel::Disconnect) => {
                        println!("Client has been disconnected: {}", client_id);
                        break;
                    }

                    None => {
                        println!("Channel closed, ending connection: {}", client_id);
                        break;
                    }
                }
            }

            else => break,
        }
    }

    println!("WebSocket connection closed");
}

async fn publish_ws(
    sender: &mut SplitSink<WebSocket, Message>,
    packet: PublishPacket,
) -> anyhow::Result<()> {
    let bytes = encode_publish(&packet);
    sender.send(Message::Binary(bytes)).await?;
    Ok(())
}