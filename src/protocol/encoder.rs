use crate::protocol::packets::PublishPacket;


pub fn encode(msg: PublishPacket) -> Vec<u8> {
     let mut out = Vec::new();
    let mut first_byte = 0b0011_0000;
    if msg.dup {
        first_byte |= 0b0000_1000;
    }

    first_byte |= (msg.qos << 1) & 0b0000_0110;

    if msg.retain {
        first_byte |= 0b0000_0001;
    }

    out.push(first_byte);

    let mut remaining_len = 2 + msg.topic.len() + msg.payload.len();

    if msg.qos > 0 {
        remaining_len += 2;
    }

    out.push(remaining_len as u8);

    out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
    out.extend_from_slice(msg.topic.as_bytes());

    if msg.qos > 0 {
        if let Some(packet_id) = msg.packet_id {
            out.extend_from_slice(&packet_id.to_be_bytes());
        }
    }

    out.extend_from_slice(&msg.payload);
    out

}