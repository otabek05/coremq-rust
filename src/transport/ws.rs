use std::{sync::Arc, time::Duration};

use axum::{
    extract::{
        State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use bytes::BytesMut;
use futures_util::{SinkExt, StreamExt, stream::SplitSink};
use tokio::{
    sync::mpsc,
    time::{self, Instant},
};

use crate::{
    engine::{ConnectCommand, PubSubCommand},
    enums::MqttChannel,
    protocol::{
        decoder::Decoder,
        encoder::{Encoder, encode_publish},
        packets::PublishPacket,
    },
    transport::ProtocolState,
};


#[derive(Clone)]
pub struct WsState {
    pub engine: Arc<ProtocolState>,
    pub port: u16,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<WsState>
) -> impl IntoResponse {
    ws.protocols(["mqtt"])
        .on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: WsState) {
    println!("Client connected via WebSocket");

    let (tx, mut rx) = mpsc::channel::<MqttChannel>(32);
    let (mut sender, mut receiver) = socket.split();

    let mut buffer = BytesMut::with_capacity(1024);
    let mut client_id = None;
    let mut timeout_duration = Duration::from_secs(60);
    let mut last_activity = Instant::now();
    let mut disconnect_requested = false;

    let mut ticker = time::interval(Duration::from_secs(5));
    ticker.set_missed_tick_behavior(time::MissedTickBehavior::Delay);

    loop {
        tokio::select! {

                _ = ticker.tick() => {
                        if last_activity.elapsed() >= timeout_duration {
                            if let Some(_) = client_id {
                                request_disconnect(&tx, &mut disconnect_requested).await;
                            }
                        }
                    }

            Some(result) = receiver.next() => {
                match result {
                    Ok(msg) => {
                        match msg {
                            Message::Binary(data) => {
                                buffer.extend_from_slice(&data);
                                while let Some(packet) = Decoder::parse_packet(&mut buffer) {


                                     let action: Encoder =   match &packet {
                                        Decoder::Connect(p) => {
                                            client_id = Some(p.client_id.clone());
                                            timeout_duration = Duration::from_secs((p.keep_alive as u64) * 3 / 2);
                                            if let Err(e) =  state.engine.connect_tx.send(ConnectCommand::Connect(p.clone(), state.port,  tx.clone() )) {
                                                println!("Error connecting:  {}", e);
                                            }
                                            Encoder::ConnAck {session_present: false, }

                                        }

                                        Decoder::Disconnect => {
                                            request_disconnect(&tx, &mut disconnect_requested).await;
                                            Encoder::Disconnect
                                        }

                                        Decoder::PingReq => {
                                             last_activity = Instant::now();
                                             Encoder::PingResp
                                        }

                                        Decoder::Publish(p) => {
                                            last_activity = Instant::now();
                                           if  let  Err(e) = state.engine.pubsub_tx.send(PubSubCommand::Publish(p.clone())) {
                                              println!("Error publishing: {}", e);
                                           }
                                            match p.packet_id {
                                                Some(packet_id) => Encoder::PubAck { packet_id },
                                                None => Encoder::None,
                                             }

                                        }

                                        Decoder::Subscribe(p) => {
                                            if let Some(ref id) = client_id {
                                                 let _ = state.engine.pubsub_tx.send(PubSubCommand::Subscribe(p.clone(), id.clone()));
                                            }

                                            Encoder::SubAck { packet_id: p.packet_id }
                                        }

                                        Decoder::Unsubscribe(p) =>{
                                            if let Some(ref id) = client_id {
                                                let _ = state.engine.pubsub_tx.send(PubSubCommand::Unsubscribe(p.clone(), id.clone()));
                                            }

                                            Encoder::UnsubAck { packet_id: p.packet_id }
                                        }

                                    };


                                    let _ = action.send_ws(&mut sender).await;

                                }
                            }

                            Message::Close(_) => {

                                 request_disconnect(&tx, &mut disconnect_requested).await;
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
                          if let Some(ref id) = client_id {
                                    let _ =  state.engine.connect_tx.send(ConnectCommand::Disconnect(id.clone())).unwrap();
                        }
                        break;
                    }

                    None => {
                        break;
                    }
                }
            }

            else => break,
        }
    }

    if let Some(id) = client_id {
        let _ = state
        .engine
            .connect_tx
            .send(ConnectCommand::Disconnect(id.clone()))
            .unwrap();
    }

    println!("WebSocket connection closed");
}

async fn request_disconnect(tx: &mpsc::Sender<MqttChannel>, flag: &mut bool) {
    if !*flag {
        let _ = tx.send(MqttChannel::Disconnect).await;
        *flag = true;
    }
}

async fn publish_ws(
    sender: &mut SplitSink<WebSocket, Message>,
    packet: PublishPacket,
) -> anyhow::Result<()> {
    let bytes = encode_publish(&packet);
    sender.send(Message::Binary(bytes)).await?;
    Ok(())
}
