
use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, stream::SplitSink};
use tokio::{io::AsyncWriteExt, net::TcpStream};



pub enum MqttResponse {
    ConnAck { session_present: bool },
    SubAck { packet_id: u16 },
    UnsubAck { packet_id: u16 },
    PubAck {  packet_id: u16},
    PingResp,
    Disconnect,
    None
}


impl MqttResponse {
    pub fn to_bytes(&self) -> Vec<u8> {
        match self {
            MqttResponse::ConnAck { session_present } => vec![
                0x20,
                0x02,
                if *session_present { 0x01 } else { 0x00 },
                0x00,
            ],

            MqttResponse::SubAck { packet_id } => vec![
                0x90,
                0x03,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
                0x00,
            ],

            MqttResponse::UnsubAck { packet_id } => vec![
                0xB0,
                0x02,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
            ],

            MqttResponse::PubAck { packet_id } =>  vec![
                0x40,
                0x02,
                (packet_id >> 8) as u8,
                (*packet_id & 0xFF) as u8,
            ],
            MqttResponse::PingResp => vec![0xD0, 0x00],

            MqttResponse::Disconnect => vec![0xE0, 0x00],
            MqttResponse::None => vec![]
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

