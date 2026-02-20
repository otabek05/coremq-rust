use std::time::SystemTime;

use bytes::{Buf, BytesMut};
use chrono::Local;

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

/*

fn parse_connect(buf: &mut BytesMut) -> Option<MqttParser> {
    let protocol_name = read_string(buf)?;
    let protocol_level = buf.get_i8();
    println!("Mqtt protocol: {}", protocol_name);

    match (protocol_name.as_str(), protocol_level) {
        ("MQTT", 4) => {
            println!("MQTT 3.1.1 client");
        }
        ("MQIsdp", 3) => {
            println!("MQTT 3.1 client");
        }
        _ => {
            println!("Unsupported MQTT version");
            return None;
        }
    }

    println!("Total buffer length before parse: {}", buf.len());


    let connect_flags = buf.get_u8();
    let keep_alive = buf.get_u16();
    let client_id = read_string(buf)?;

    let clean_session = (connect_flags & 0b0000_0010) != 0;
    let username_flag = (connect_flags & 0b1000_0000) != 0;
    let password_flag = (connect_flags & 0b0100_0000) != 0;

    let username = if username_flag {
    match read_string(buf) {
        Some(u) => Some(u),
        None => {
            println!("Failed reading username");
            return None;
        }
    }
} else {
            println!("Failed reading username: ");
    None
};

/*

let username = if username_flag {
    Some(read_string(buf)?)
} else {
    None
};
*/


   let password = if password_flag {
    match read_string(buf) {
        Some(p) => Some(p),
        None => {
            println!("Failed reading password");
            return None;
        }
    }
} else {
    println!("Failed reading password: ");
    None
};
/*
let password = if password_flag {
    Some(read_string(buf)?)
} else {
    None
};

*/


Some(MqttParser::Connect(ConnectPacket {
        client_id,
        keep_alive,
        clean_session,
        username,
        password,
    }))
}

*/


fn parse_connect(buf: &mut BytesMut) -> Option<MqttParser> {
    println!("---- PARSING CONNECT ----");
    println!("Initial buffer length: {}", buf.len());

    let protocol_name = read_string(buf)?;
    let protocol_level = buf.get_u8();

    println!("Protocol: {}, Level: {}", protocol_name, protocol_level);

    match (protocol_name.as_str(), protocol_level) {
        ("MQTT", 4) => println!("MQTT 3.1.1 client"),
        ("MQIsdp", 3) => println!("MQTT 3.1 client"),
        _ => {
            println!("Unsupported MQTT version");
            return None;
        }
    }

    if buf.len() < 3 {
        println!("Buffer too small for flags + keepalive");
        return None;
    }

    let connect_flags = buf.get_u8();
    let keep_alive = buf.get_u16();

    println!("Connect flags: {:08b}", connect_flags);
    println!("Keep alive: {}", keep_alive);
    println!("Buffer length after flags: {}", buf.len());

    let clean_session = (connect_flags & 0b0000_0010) != 0;
    let will_flag     = (connect_flags & 0b0000_0100) != 0;
    let will_qos      = (connect_flags & 0b0001_1000) >> 3;
    let will_retain   = (connect_flags & 0b0010_0000) != 0;
    let password_flag = (connect_flags & 0b0100_0000) != 0;
    let username_flag = (connect_flags & 0b1000_0000) != 0;

    println!("clean_session: {}", clean_session);
    println!("will_flag: {}", will_flag);
    println!("will_qos: {}", will_qos);
    println!("will_retain: {}", will_retain);
    println!("username_flag: {}", username_flag);
    println!("password_flag: {}", password_flag);

    // ---- Client ID ----
    let client_id = match read_string(buf) {
        Some(id) => {
            println!("Client ID: {}", id);
            id
        }
        None => {
            println!("Failed reading client_id");
            return None;
        }
    };

    println!("Buffer after client_id: {}", buf.len());

    // ---- WILL ----
    let will_topic = if will_flag {
        match read_string(buf) {
            Some(t) => {
                println!("Will topic: {}", t);
                Some(t)
            }
            None => {
                println!("Failed reading will_topic");
                return None;
            }
        }
    } else {
        None
    };

    let will_message = if will_flag {
        match read_string(buf) {
            Some(m) => {
                println!("Will message len: {}", m.len());
                Some(m)
            }
            None => {
                println!("Failed reading will_message");
                return None;
            }
        }
    } else {
        None
    };

    println!("Buffer after will: {}", buf.len());

    // ---- USERNAME ----
    let username = if username_flag {
        match read_string(buf) {
            Some(u) => {
                println!("Username: {}", u);
                Some(u)
            }
            None => {
                println!("Failed reading username");
                return None;
            }
        }
    } else {
        println!("Username flag not set");
        None
    };

    println!("Buffer after username: {}", buf.len());

    // ---- PASSWORD ----
    let password = if password_flag {
        match read_string(buf) {
            Some(p) => {
                println!("Password length: {}", p.len());
                Some(p)
            }
            None => {
                println!("Failed reading password");
                return None;
            }
        }
    } else {
        println!("Password flag not set");
        None
    };

    println!("Buffer after password: {}", buf.len());
    println!("---- CONNECT PARSED SUCCESSFULLY ----");

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
        subscribed_at: Local::now()
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
        println!("Not enough bytes for string length");
        return None;
    }

    let len = ((buf[0] as usize) << 8) | (buf[1] as usize);
    buf.advance(2); // consume length bytes

    if buf.len() < len {
        println!("Buffer too short for string, expected {} bytes, got {}", len, buf.len());
        return None;
    }

    let s = std::str::from_utf8(&buf[..len]).ok()?.to_string();
    buf.advance(len); // consume string bytes

    Some(s)
}


/*
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
*/