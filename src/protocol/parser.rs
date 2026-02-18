use std::time::SystemTime;

use bytes::{Buf, BytesMut};

use crate::{enums::packet_type::MqttPacketType, protocol::{header::Header, packets::*}};


pub enum MqttParser {
    Connect(ConnectPacket),
    Publish(PublishPacket),
    Subscribe(SubscribePacket),
    Unsubscribe(UnsubscribePacket),
    PingReq,
    Disconnect,
}

impl MqttParser {
    pub fn parse_packet(buf: &mut BytesMut) -> Option<MqttParser> {
        let header = Header::parse(buf)?;
        if buf.len() < header.remaining_length {
            return None;
        }

        let mut packet_buf = buf.split_to(header.remaining_length);
        match header.packet_type {
            MqttPacketType::Connect => parse_connect(&mut packet_buf),
            MqttPacketType::Publish => parse_publish(header.flags, &mut packet_buf),
            MqttPacketType::Subscribe => parse_subscribe(&mut packet_buf),
            MqttPacketType::Unsubscribe => parse_unsubscribe(&mut  packet_buf),
            MqttPacketType::PingReq => Some(MqttParser::PingReq),
            MqttPacketType::Disconnect => Some(MqttParser::Disconnect),
        _ => None,

        }
    }

}


fn parse_connect(buf: &mut BytesMut) -> Option<MqttParser> {
    let protocol_name = read_string(buf)?;
    if protocol_name != "MQTT" {
        return None;
    }

    let protocol_level = buf.get_i8();
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

    Some(MqttParser::Connect(ConnectPacket {
        client_id,
        keep_alive,
        clean_session,
        username,
        password,
    }))
}

fn parse_publish(flags: u8, buf: &mut BytesMut) -> Option<MqttParser> {
    let dup = (flags & 0b1000) != 0;
    let qos = (flags & 0b0110) >> 1;
    let retain = (flags & 0b0001) != 0;
    let topic = read_string(buf)?;

    let packet_id = if qos > 0 {
        if buf.len() < 2 {
            return None;
        }
        Some(buf.get_u16())
    } else {
        None
    };



    let payload = buf.to_vec();

    Some(MqttParser::Publish(PublishPacket {
        packet_id,
        topic,
        payload,
        qos,
        retain,
        dup,
    }))
}

fn parse_subscribe(buf: &mut BytesMut) -> Option<MqttParser> {
    if buf.len() < 2 {
        return None;
    }

    let packet_id = buf.get_u16();

    let topic = read_string(buf)?;
    let qos = buf.get_u8();

    Some(MqttParser::Subscribe(SubscribePacket {
        packet_id,
        topic,
        qos,
        subscribed_at: SystemTime::now()
    }))

}

fn parse_unsubscribe(buf: &mut BytesMut) -> Option<MqttParser> {
    let packet_id = buf.get_u16();
    let topic = read_string(buf)?;

    Some(MqttParser::Unsubscribe(UnsubscribePacket{
        packet_id,
        topic
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