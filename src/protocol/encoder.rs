use crate::protocol::packets::PublishPacket;


use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, stream::SplitSink};
use tokio::{io::AsyncWriteExt, net::TcpStream};



pub enum Encoder {
    ConnAck { session_present: bool },
    SubAck { packet_id: u16 },
    UnsubAck { packet_id: u16 },
    PubAck {  packet_id: u16},
    PingResp,
    Disconnect,
    None
}


impl Encoder {
    pub fn to_bytes(&self) -> Vec<u8> {
        match self {
            Encoder::ConnAck { session_present } => vec![
                0x20,
                0x02,
                if *session_present { 0x01 } else { 0x00 },
                0x00,
            ],

            Encoder::SubAck { packet_id } => vec![
                0x90,
                0x03,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
                0x00,
            ],

            Encoder::UnsubAck { packet_id } => vec![
                0xB0,
                0x02,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
            ],

            Encoder::PubAck { packet_id } =>  vec![
                0x40,
                0x02,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
            ],
            Encoder::PingResp => vec![0xD0, 0x00],

            Encoder::Disconnect => vec![0xE0, 0x00],
            Encoder::None => vec![]
        }
    }


    pub async fn send_tcp(self, socket: &mut TcpStream) -> anyhow::Result<()> {
        let bytes = self.to_bytes();
        socket.write_all(&bytes).await?;
        Ok(())
    }

   pub async fn send_ws(
    self,
    sender: &mut SplitSink<WebSocket, Message>,
) -> anyhow::Result<()> {
    let bytes = self.to_bytes();
    sender.send(Message::Binary(bytes)).await?;
    Ok(())
}

}



pub fn encode_publish(msg: &PublishPacket) -> Vec<u8> {
    let mut out = Vec::new();

    let mut first_byte = 0b0011_0000;

    if msg.dup {
        first_byte |= 0b0000_1000;
    }

    let qos = msg.qos & 0x03;
    first_byte |= qos << 1;

    if msg.retain {
        first_byte |= 0b0000_0001;
    }

    out.push(first_byte);

    let mut remaining_len =
        2 + msg.topic.len() + msg.payload.len();

    if qos > 0 {
        remaining_len += 2;
    }

    out.extend(encode_remaining_length(remaining_len));

    out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
    out.extend_from_slice(msg.topic.as_bytes());

    if qos > 0 {
        let packet_id = msg.packet_id.expect("QoS > 0 requires packet_id");
        out.extend_from_slice(&packet_id.to_be_bytes());
    }

    out.extend_from_slice(&msg.payload);

    out
}

fn encode_remaining_length(mut len: usize) -> Vec<u8> {
    let mut encoded = Vec::new();

    loop {
        let mut byte = (len % 128) as u8;
        len /= 128;

        if len > 0 {
            byte |= 0x80;
        }

        encoded.push(byte);

        if len == 0 {
            break;
        }
    }

    encoded
}
