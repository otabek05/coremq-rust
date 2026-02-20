use std::{sync::Arc, time::Duration};

use crate::{
    broker::engine::Engine,
    enums::MqttChannel,
    protocol::{packets::PublishPacket, parser::MqttParser},
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
    let mut out = Vec::new();
    let mut first_byte = 0b0011_0000;
    if msg.dup {
        first_byte |= 0b0000_1000;
    }

    first_byte |= (msg.qos << 1) & 0b0000_0110;

    if msg.retain {
        first_byte |= 0b0000_0001;
    }

    out.push(first_byte);

    let mut remaining_len = 2 + msg.topic.len() + msg.payload.len();

    if msg.qos > 0 {
        remaining_len += 2;
    }

    out.push(remaining_len as u8);

    out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
    out.extend_from_slice(msg.topic.as_bytes());

    if msg.qos > 0 {
        if let Some(packet_id) = msg.packet_id {
            out.extend_from_slice(&packet_id.to_be_bytes());
        }
    }

    out.extend_from_slice(&msg.payload);

    socket.write_all(&out).await?;
    Ok(())
}
