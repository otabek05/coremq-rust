
#[derive(Clone, Copy, PartialEq, Eq, Debug )]
pub enum MqttPacketType {
    Connect = 1,
    ConnAck = 2,
    Publish = 3,
    PubAck = 4,
    PubRec = 5,
    PubRel = 6,
    PubComp = 7,
    Subscribe = 8,
    SubAck = 9,
    Unsubscribe = 10,
    UnsubAck = 11,
    PingReq = 12,
    PingResp = 13,
    Disconnect = 14,
}

impl MqttPacketType {
    pub fn from_u8(val: u8) -> Option<Self> {
        match val {
            1 => Some(MqttPacketType::Connect),
            2 => Some(MqttPacketType::ConnAck),
            3 => Some(MqttPacketType::Publish),
            4 => Some(MqttPacketType::PubAck),
            5 => Some(MqttPacketType::PubRec),
            6 => Some(MqttPacketType::PubRel),
            7 => Some(MqttPacketType::PubComp),
            8 => Some(MqttPacketType::Subscribe),
            9 => Some(MqttPacketType::SubAck),
            10 => Some(MqttPacketType::Unsubscribe),
            11 => Some(MqttPacketType::UnsubAck),
            12 => Some(MqttPacketType::PingReq),
            13 => Some(MqttPacketType::PingResp),
            14 => Some(MqttPacketType::Disconnect),
            _ => None,
        }
    }
}
