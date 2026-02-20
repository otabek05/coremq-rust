use crate::protocol::packets::PublishPacket;


pub fn encode_publish(msg: &PublishPacket) -> Vec<u8> {
    let mut out = Vec::new();

    let mut first_byte = 0b0011_0000;

    if msg.dup {
        first_byte |= 0b0000_1000;
    }

    let qos = msg.qos & 0x03;
    first_byte |= qos << 1;

    if msg.retain {
        first_byte |= 0b0000_0001;
    }

    out.push(first_byte);

    let mut remaining_len =
        2 + msg.topic.len() + msg.payload.len();

    if qos > 0 {
        remaining_len += 2;
    }

    out.extend(encode_remaining_length(remaining_len));

    out.extend_from_slice(&(msg.topic.len() as u16).to_be_bytes());
    out.extend_from_slice(msg.topic.as_bytes());

    if qos > 0 {
        let packet_id = msg.packet_id.expect("QoS > 0 requires packet_id");
        out.extend_from_slice(&packet_id.to_be_bytes());
    }

    out.extend_from_slice(&msg.payload);

    out
}

fn encode_remaining_length(mut len: usize) -> Vec<u8> {
    let mut encoded = Vec::new();

    loop {
        let mut byte = (len % 128) as u8;
        len /= 128;

        if len > 0 {
            byte |= 0x80;
        }

        encoded.push(byte);

        if len == 0 {
            break;
        }
    }

    encoded
}
