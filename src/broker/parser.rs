use bytes::{Buf, BytesMut};

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
