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
    broker::engine::Engine, enums::MqttChannel, protocol::{encoder::encode, packets::PublishPacket, parser::MqttParser}
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
                                     action.send_ws(&mut sender).await;
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
    let bytes = encode(packet);
    sender.send(Message::Binary(bytes)).await?;
    Ok(())
}


/*
 
async fn handle_mqtt_packet(
    data: &[u8],
    socket: &mut WebSocket,
) {
    let packet_type = data[0] >> 4;

    match packet_type {
        1 => {
            println!("CONNECT packet");

            let connack = vec![0x20, 0x02, 0x00, 0x00];

            socket
                .send(Message::Binary(connack))
                .await
                .unwrap();
        }

        8 => {
            println!("SUBSCRIBE packet");

            // Extract packet identifier
            let packet_id = ((data[2] as u16) << 8) | data[3] as u16;

            // SUBACK
            let suback = vec![
                0x90,       // SUBACK type
                0x03,       // Remaining length
                data[2],    // Packet ID MSB
                data[3],    // Packet ID LSB
                0x00        // QoS 0 granted
            ];

            socket
                .send(Message::Binary(suback))
                .await
                .unwrap();
        }

        12 => {
            println!("PINGREQ");

            let pingresp = vec![0xD0, 0x00];

            socket
                .send(Message::Binary(pingresp))
                .await
                .unwrap();
        }

        3 => {
            println!("PUBLISH packet");
        }

        _ => {
            println!("Unknown packet: {}", packet_type);
        }
    }
}


*/