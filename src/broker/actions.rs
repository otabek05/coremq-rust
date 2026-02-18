
use tokio::{io::AsyncWriteExt, net::TcpStream};



pub enum MqttResponse {
    ConnAck { session_present: bool },
    SubAck { packet_id: u16 },
    UnsubAck { packet_id: u16 },
    PubAck { packet_id: u16 },
    PingResp,
    Disconnect,
    None
}


impl MqttResponse {
    pub async fn send(self, socket: &mut TcpStream) -> anyhow::Result<()> {
        match self {
            MqttResponse::ConnAck { session_present } => {
                let bytes = [
                    0x20,
                    0x02,
                    if session_present { 0x01 } else { 0x00 },
                    0x00,
                ];
                socket.write_all(&bytes).await?;
            }

            MqttResponse::SubAck { packet_id } => {
                let bytes = [
                    0x90,
                    0x03,
                    (packet_id >> 8) as u8,
                    (packet_id & 0xFF) as u8,
                    0x00,
                ];
                socket.write_all(&bytes).await?;
            }

            MqttResponse::UnsubAck { packet_id } => {
                let bytes = [
                    0xB0,
                    0x02,
                    (packet_id >> 8) as u8,
                    (packet_id & 0xFF) as u8,
                ];
                socket.write_all(&bytes).await?;
            }

            MqttResponse::PubAck { packet_id } => {
                let bytes = [
                    0x40,
                    0x02,
                    (packet_id >> 8) as u8,
                    (packet_id & 0xFF) as u8,
                ];
                socket.write_all(&bytes).await?;
            }

            MqttResponse::PingResp => {
                socket.write_all(&[0xD0, 0x00]).await?;
            }

            MqttResponse::Disconnect => {
                socket.write_all(&[0xE0, 0x00]).await?;
            }
            
            MqttResponse::None => {}
        }

        Ok(())
    }
}
