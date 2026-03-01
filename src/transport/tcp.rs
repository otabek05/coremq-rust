use bytes::BytesMut;
use std::{sync::Arc, time::Duration};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::mpsc,
    time::{self, Instant},
};

use crate::{
    engine::{ConnectCommand, PubSubCommand}, enums::MqttChannel, protocol::{decoder::Decoder, encoder::{Encoder, encode_publish}, packets::PublishPacket}, transport::ProtocolState
};

pub async fn tcp_connection(
    mut socket: TcpStream,
    state: Arc<ProtocolState>,
    connected_port: u16,
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
                            if let Some(_) = client_id {
                                request_disconnect(&tx, &mut disconnect_requested).await;
                            }
                        }
                    }

                    read = socket.read_buf(&mut buffer) => {
                        match read {
                            Ok(0) => {
                                if let Some(_) = client_id {
                                    request_disconnect(&tx, &mut disconnect_requested).await;
                                }
                                break;
                            }

                            Ok(_) => {
                                last_activity = Instant::now();

                                while let Some(packet) = Decoder::parse_packet(&mut buffer) {
                                  let action: Encoder =   match &packet {
                                        Decoder::Connect(p) => {
                                            client_id = Some(p.client_id.clone());
                                            timeout_duration = Duration::from_secs((p.keep_alive as u64) * 3 / 2);
                                            if let Err(e) =  state.connect_tx.send(ConnectCommand::Connect(p.clone(), connected_port,  tx.clone() )) {
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
                                           if  let  Err(e) = state.pubsub_tx.send(PubSubCommand::Publish(p.clone())) {
                                              println!("Error publishing: {}", e);
                                           }
                                            match p.packet_id {
                                                Some(packet_id) => Encoder::PubAck { packet_id },
                                                None => Encoder::None,
                                             }

                                        }

                                        Decoder::Subscribe(p) => {
                                            if let Some(ref id) = client_id {
                                                 let _ = state.pubsub_tx.send(PubSubCommand::Subscribe(p.clone(), id.clone()));
                                            }
                                          
                                            Encoder::SubAck { packet_id: p.packet_id }
                                        }

                                        Decoder::Unsubscribe(p) =>{
                                            if let Some(ref id) = client_id {
                                                let _ = state.pubsub_tx.send(PubSubCommand::Unsubscribe(p.clone(), id.clone()));
                                            }
                                            
                                            Encoder::UnsubAck { packet_id: p.packet_id }
                                        }
                                    };


                                    let _ = action.send_tcp(&mut socket).await;

                                }
                            }

                            Err(_) => {
  
                                if let Some(_) = client_id {
                                    request_disconnect(&tx, &mut disconnect_requested).await;
                                }
                                break;
                            }
                        }
                    }

           
                    msg = rx.recv() => {
                        match msg {
                            Some(MqttChannel::Disconnect) => {
                                if let Some(ref id) = client_id {
                                    let _ =  state.connect_tx.send(ConnectCommand::Disconnect(id.clone())).unwrap();
                                }
                                break;
                            }

                            Some(MqttChannel::Publish(packet)) => {
                                if publish(&mut socket, packet).await.is_err() {
                                    if let Some(_) = client_id {
                                        request_disconnect(&tx, &mut disconnect_requested).await;
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
          let _ =  state.connect_tx.send(ConnectCommand::Disconnect(id.clone())).unwrap();
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
