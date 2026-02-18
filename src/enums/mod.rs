use crate::protocol::packets::PublishPacket;

pub mod packet_type;

pub enum MqttChannel {
    Publish(PublishPacket),
    Disconnect, // Explicit signal to close connection
}