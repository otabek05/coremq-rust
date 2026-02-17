use std::time::SystemTime;

use bytes::{Buf, BytesMut};

use crate::{
    enums::mqtt_packet::MqttPacketType,
    utils::fixed_header::FixedHeader,
};

#[derive(Debug, Clone)]
pub struct ConnectPacket {
    pub client_id: String,
    pub keep_alive: u16,
    pub clean_session: bool,
    pub username: Option<String>,
    pub password: Option<String>,
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
    pub subscribed_at: SystemTime
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

        println!("request reseived: {:?}", header.packet_type);

        let mut packet_buf = buf.split_to(header.remaining_length);
        match header.packet_type {
            MqttPacketType::Connect => parse_connect(&mut packet_buf),
            MqttPacketType::Publish => parse_publish(header.flags, &mut packet_buf),
            MqttPacketType::Subscribe => parse_subscribe(&mut packet_buf),
            MqttPacketType::PingReq => Some(MqttPacket::PingReq),
            MqttPacketType::Disconnect => Some(MqttPacket::Disconnect),
        _ => None,

        }
    }

}


fn parse_connect(buf: &mut BytesMut) -> Option<MqttPacket> {
    let protocol_name = read_string(buf)?;
    if protocol_name != "MQTT" {
        return None;
    }

    let protocol_level = buf.get_u8();
    if protocol_level != 4 {
        return None;
    }

    let connect_flags = buf.get_u8();
    let keep_alive = buf.get_u16();
    let client_id = read_string(buf)?;

    let clean_session = (connect_flags & 0b0000_0010) != 0;
    let username_flag = (connect_flags & 0b1000_0000) != 0;
    let password_flag = (connect_flags & 0b0100_0000) != 0;

    let username = if username_flag {
        Some(read_string(buf)?)
    } else {
        None
    };

    let password = if password_flag {
        Some(read_string(buf)?)
    } else {
        None
    };

    Some(MqttPacket::Connect(ConnectPacket {
        client_id,
        keep_alive,
        clean_session,
        username,
        password,
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
        subscribed_at: SystemTime::now()
    }))

}



 fn read_string(buf: &mut BytesMut) -> Option<String> {
    if buf.len() < 2 {
        return None;
    }
    let len = u16::from_be_bytes([buf[0], buf[1]]) as usize;
    if buf.len() < 2 + len {
        return None;
    }
    
    buf.advance(2);
    let s = String::from_utf8(buf.split_to(len).to_vec()).ok()?;
    Some(s)
}