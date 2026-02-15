use bytes::{Buf, BytesMut};

use crate::{broker::parser::read_remaining_length, enums::mqtt_packet::MqttPacketType};



pub struct FixedHeader {
    pub packet_type: MqttPacketType,
    pub flags: u8,
    pub remaining_length: usize
}

impl  FixedHeader  {
    pub fn parse(buf : &mut BytesMut) -> Option<FixedHeader> {
        if buf.len() < 2 {
            return None;
        }

        let byte1 = buf[0];
        let packet_type_raw = byte1 >> 4;
        let flags = byte1 & 0x0F;
        let packet_type = MqttPacketType::from_u8(packet_type_raw)?;
        buf.advance(1);
        let remaining_length = read_remaining_length(buf)?;
        Some(FixedHeader { packet_type, flags, remaining_length })
    }

    pub fn read_remaining_length(buf: &mut BytesMut) -> Option<usize> {
    let mut multiplier = 1;
    let mut value = 0;
    let mut i = 0;

    loop {
        if buf.len() <= i {
            return None;
        }
        let byte = buf[i];
        value += ((byte & 127) as usize) * multiplier;
        multiplier *= 128;
        i += 1;
        if byte & 128 == 0 {
            buf.advance(i);
            return Some(value);
        }
    }
}

pub fn read_string(buf: &mut BytesMut) -> Option<String> {
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

}