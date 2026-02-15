use bytes::{Buf, BytesMut};

use crate::{
    broker::parser::read_string, enums::mqtt_packet::MqttPacketType,
    utils::fixed_header::FixedHeader,
};

#[derive(Debug, Clone)]
pub struct ConnectPacket {
    pub client_id: String,
    pub keep_alive: u16,
}

#[derive(Debug, Clone)]
pub struct PublishPacket {
    pub topic: String,
    pub payload: Vec<u8>,
    pub qos: u8,
    pub retain: bool,
    pub dup: bool,
}

#[derive(Debug, Clone)]
pub struct SubscribePacket {
    pub packet_id: u16,
    pub topic: String,
    pub qos: u8,
}

pub enum MqttPacket {
    Connect(ConnectPacket),
    Publish(PublishPacket),
    Subscribe(SubscribePacket),
    PingReq,
    Disconnect,
}

impl MqttPacket {
    pub fn parse_packet(buf: &mut BytesMut) -> Option<MqttPacket> {
        let header = FixedHeader::parse(buf)?;
        if buf.len() < header.remaining_length {
            return None;
        }

        let mut packet_buf = buf.split_to(header.remaining_length);
        match header.packet_type {
            MqttPacketType::Connect => parse_connect(&mut packet_buf),
            MqttPacketType::Publish => parse_publish(header.flags, buf),
            MqttPacketType::Subscribe => parse_subscribe(buf),
             MqttPacketType::PingReq => Some(MqttPacket::PingReq),
        MqttPacketType::Disconnect => Some(MqttPacket::Disconnect),
        _ => None,

        }
    }
}

fn parse_connect(buf: &mut BytesMut) -> Option<MqttPacket> {
    let protocol_name = read_string(buf)?;
    buf.advance(1);
    let _connect_flag = buf.get_u8();
    let keep_alive = buf.get_u16();
    let client_id = read_string(buf)?;

    Some(MqttPacket::Connect(ConnectPacket {
        client_id,
        keep_alive,
    }))
}

fn parse_publish(flags: u8, buf: &mut BytesMut) -> Option<MqttPacket> {
    let dup = (flags & 0b1000) != 0;
    let qos = (flags & 0b0110) >> 1;
    let retain = (flags & 0b0001) != 0;
    let topic = read_string(buf)?;

    if qos > 0 {
        buf.advance(2); // packet identifier (skip for now)
    }

    let payload = buf.to_vec();

    Some(MqttPacket::Publish(PublishPacket {
        topic,
        payload,
        qos,
        retain,
        dup,
    }))
}

fn parse_subscribe(buf: &mut BytesMut) -> Option<MqttPacket> {
    if buf.len() < 2 {
        return None;
    }

    let packet_id = buf.get_u16();

    let topic = read_string(buf)?;
    let qos = buf.get_u8();

    Some(MqttPacket::Subscribe(SubscribePacket {
        packet_id,
        topic,
        qos,
    }))
}
