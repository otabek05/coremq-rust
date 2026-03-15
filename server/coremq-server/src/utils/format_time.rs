use chrono::{DateTime, Local};
use serde::Serializer;

pub fn format_datetime<S>(
    datetime: &DateTime<Local>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let formatted = datetime.format("%Y-%m-%d %H:%M:%S").to_string();
    serializer.serialize_str(&formatted)
}
