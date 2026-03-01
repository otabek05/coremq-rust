use crate::protocol::packets::PublishPacket;

pub mod packet;
pub mod jwt;
pub mod role;
pub mod protocol;

pub enum MqttChannel {
    Publish(PublishPacket),
    Disconnect,
}