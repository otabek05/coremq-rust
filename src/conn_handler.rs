use bytes::{Buf, BytesMut};
use std::sync::Arc;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    sync::{Mutex, mpsc},
};

use crate::broker::{
    parser::{read_remaining_length, read_string},
    *,
};

pub async fn handle_client(
    mut socket: TcpStream,
    broker: Arc<Mutex<Broker>>,
) -> anyhow::Result<()> {
    let (tx, mut rx) = mpsc::channel::<Publish>(32);
    let mut buffer = BytesMut::with_capacity(1024);

    loop {
        tokio::select! {
                    n = socket.read_buf(&mut buffer) => {
                        let n = n?;
                        if n == 0 {
                            break;
                        }

                        while buffer.len() >= 2 {
                            let packet_type = buffer[0] >> 4;
                            buffer.advance(1);

                            let remaining = match read_remaining_length(&mut buffer) {
                                Some(r) => r,
                                None => break,
                            };

                            if buffer.len() < remaining {
                                break;
                            }

                            let mut packet = buffer.split_to(remaining);

                            match packet_type {
                                1 => { // CONNECT
                                    println!("client connected");
                                    socket.write_all(&[0x20, 0x02, 0x00, 0x00]).await?;
                                }

                                8 => { // SUBSCRIBE
                                    packet.advance(2); // packet id
                                    let topic = read_string(&mut packet).unwrap();
                                    packet.advance(1); // QoS

                                    broker.lock().await.subscribe(topic, tx.clone());

                                    socket
                                        .write_all(&[0x90, 0x03, 0x00, 0x01, 0x00])
                                        .await?;
                                }

                                3 => { // PUBLISH
                                    let topic = read_string(&mut packet).unwrap();
                                    let payload = packet.to_vec();

                                    broker.lock().await.publish(Publish {
                                        topic,
                                        payload,
                                    }).await;
                                }

                                12 => { // PINGREQ
                                      socket.write_all(&[0xD0, 0x00]).await?;
                                 }

                                _ => {}
                            }
                        }
                    }

                    Some(msg) = rx.recv() => {
                        let mut out = Vec::new();
                        out.push(0x30);

                        let len = 2 + msg.topic.len() + msg.payload.len();
                        out.push(len as u8);

                        out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
                        out.extend_from_slice(msg.topic.as_bytes());
                        out.extend_from_slice(&msg.payload);

                        socket.write_all(&out).await?;
                    }
                }
    }

    Ok(())
}
