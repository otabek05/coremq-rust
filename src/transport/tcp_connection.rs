use std::{sync::Arc, time::Duration};

use crate::{
    broker::engine::Engine,
    enums::MqttChannel,
    protocol::{encoder::encode_publish, packets::PublishPacket, parser::MqttParser},
};
use anyhow::Ok;
use bytes::BytesMut;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::mpsc,
    time::{self, Instant},
};

pub async fn handle_connection(mut socket: TcpStream, engine: Arc<Engine>) -> anyhow::Result<()> {
    let (tx, mut rx) = mpsc::channel::<MqttChannel>(32);
    let mut buffer = BytesMut::with_capacity(1024);
    let mut client_id = String::new();
    let mut timeout_duration = Duration::from_secs(60);

    let mut last_activity = Instant::now();
    let mut ticker = time::interval(Duration::from_secs(10));
    ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        tokio::select! {

                     _ = ticker.tick() => {
                    if last_activity.elapsed() >= timeout_duration {
                         engine.drop_client(&client_id).await;
                         println!("Connection timeout: {}", client_id);
                         break;
                    }
                }

                        read = socket.read_buf(&mut buffer) => {

                                let n = read?;
                                if n == 0 {
                                    println!("Socket closed by client: {}", client_id);
                                    engine.drop_client(&client_id).await;
                                    break;
                                }

                                while let Some(packet) = MqttParser::parse_packet(&mut buffer) {
                                    if let MqttParser::Connect(ref p) = packet {
                                        client_id = p.client_id.clone();
                                        println!("keep: alive: {}", p.keep_alive * 3 /2);
                                        timeout_duration = Duration::from_secs((p.keep_alive as u64) * 3 / 2);

                                       }

                                       if let MqttParser::PingReq = packet {
                                         last_activity = Instant::now();
                                       }

                                       let action = engine.handle(&client_id, &packet, tx.clone()).await;
                                             action.send_tcp(&mut socket).await?
                                       }
                        }

                        msg = rx.recv() => {
                           match msg {
                               Some(MqttChannel::Publish(packet)) => {
                                     publish(&mut socket, packet).await?;
                                }
                                Some(MqttChannel::Disconnect) => {
                                      println!("Client disconnected: {}", client_id);
                                      break;
                                }
                                None => {
                                      println!("Channel closed, ending connection: {}", client_id);
                                      break;
                               }
                            }
                        }


                }
    }

    Ok(())
}

async fn publish(socket: &mut TcpStream, msg: PublishPacket) -> anyhow::Result<()> {
    let bytes = encode_publish(&msg);
    socket.write_all(&bytes).await?;
    Ok(())
}
