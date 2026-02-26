use bytes::BytesMut;
use std::{time::Duration};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::mpsc,
    time::{self, Instant},
};

use crate::{
    broker::actions::MqttResponse,
    engine::engine::EngineCommand,
    enums::MqttChannel,
    protocol::{encoder::encode_publish, packets::PublishPacket, parser::MqttParser},
};

pub async fn tcp_connection(
    mut socket: TcpStream,
    engine_tx: mpsc::UnboundedSender<EngineCommand>,
) -> anyhow::Result<()> {
    let (tx, mut rx) = mpsc::channel::<MqttChannel>(2048);
    let mut buffer = BytesMut::with_capacity(4096);

    let mut client_id: Option<String> = None;
    let mut timeout_duration = Duration::from_secs(60);
    let mut last_activity = Instant::now();
    let mut disconnect_requested = false;

    let mut ticker = time::interval(Duration::from_secs(5));
    ticker.set_missed_tick_behavior(time::MissedTickBehavior::Delay);

    loop {
        tokio::select! {
                    // 🔹 Idle timeout check
                    _ = ticker.tick() => {
                        if last_activity.elapsed() >= timeout_duration {
                            if let Some(ref id) = client_id {
                                request_disconnect(&tx, &mut disconnect_requested).await;
                              //  println!("Idle timeout, requesting disconnect for {}", id);
                            }
                        }
                    }

                    read = socket.read_buf(&mut buffer) => {
                        match read {
                            Ok(0) => {
                                if let Some(ref id) = client_id {
                                    request_disconnect(&tx, &mut disconnect_requested).await;
                                   // println!("Socket closed by client {}, requesting disconnect", id);
                                }
                                break;
                            }

                            Ok(_) => {
                                last_activity = Instant::now();

                                while let Some(packet) = MqttParser::parse_packet(&mut buffer) {
                                  let action: MqttResponse =   match &packet {
                                        MqttParser::Connect(p) => {
                                            client_id = Some(p.client_id.clone());
                                            timeout_duration = Duration::from_secs((p.keep_alive as u64) * 3 / 2);
                                            let _ =  engine_tx.send(EngineCommand::Connect(p.clone(), tx.clone() )).unwrap();
                                            MqttResponse::ConnAck {session_present: false, }

                                        }

                                        MqttParser::Disconnect => {
                                            request_disconnect(&tx, &mut disconnect_requested).await;
                                            MqttResponse::Disconnect
                                        }

                                        MqttParser::PingReq => {
                                             last_activity = Instant::now();
                                             MqttResponse::PingResp
                                        }

                                        MqttParser::Publish(p) => {
                                            last_activity = Instant::now();
                                            let  _ = engine_tx.send(EngineCommand::Publish(p.clone())).unwrap();
                                            match p.packet_id {
                                                Some(packet_id) => MqttResponse::PubAck { packet_id },
                                                None => MqttResponse::None,
                                             }

                                        }

                                        

                                        MqttParser::Subscribe(p) => {
                                            if let Some(ref id) = client_id {
                                                 let _ = engine_tx.send(EngineCommand::Subscribe(p.clone(), id.clone()));
                                            }
                                          
                                            MqttResponse::SubAck { packet_id: p.packet_id }
                                        }

                                        MqttParser::Unsubscribe(p) =>{
                                            if let Some(ref id) = client_id {
                                                let _ = engine_tx.send(EngineCommand::Unsubscribe(p.clone(), id.clone()));
                                            }
                                            MqttResponse::UnsubAck { packet_id: p.packet_id }
                                        }
                                        _ => {
                                            MqttResponse::None
                                        }
                                    };


                                    let _ = action.send_tcp(&mut socket).await;

                                }
                            }

                            Err(err) => {
                             //   eprintln!("Socket read error: {:?}", err);
                                if let Some(ref id) = client_id {
                                    request_disconnect(&tx, &mut disconnect_requested).await;
                                }
                                break;
                            }
                        }
                    }

                    // 🔹 Mailbox branch
                    msg = rx.recv() => {
                        match msg {
                            Some(MqttChannel::Disconnect) => {
                                if let Some(ref id) = client_id {
                                    let _ =  engine_tx.send(EngineCommand::Disconnect(id.clone())).unwrap();
                                   // println!("Disconnect received, cleaning client: {}", id);
                                }
                                break;
                            }

                            Some(MqttChannel::Publish(packet)) => {
                                if publish(&mut socket, packet).await.is_err() {
                                    if let Some(ref id) = client_id {
                                        request_disconnect(&tx, &mut disconnect_requested).await;
                                      //  println!("Failed to publish to {}, requesting disconnect", id);
                                    }
                                }
                            }

                            None => {
                                if let Some(ref id) = client_id {
                                    println!("Mailbox closed for client: {}", id);
                                }
                                break;
                            }
                        }
                    }
                }
    }

    if let Some(id) = client_id {
        let _ =  engine_tx.send(EngineCommand::Disconnect(id.clone())).unwrap();
        //    engine.drop_client(&id).await;
       // println!("Cleanup complete for client: {}", id);
    }

    Ok(())
}


async fn request_disconnect(tx: &mpsc::Sender<MqttChannel>, flag: &mut bool) {
    if !*flag {
        let _ = tx.send(MqttChannel::Disconnect).await;
        *flag = true;
    }
}
    
async fn publish(socket: &mut TcpStream, msg: PublishPacket) -> anyhow::Result<()> {
    let bytes = encode_publish(&msg);
    socket.write_all(&bytes).await?;
    Ok(())
}
