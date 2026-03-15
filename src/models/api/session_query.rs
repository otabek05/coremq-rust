use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SessionQuery {
    pub page: Option<usize>,    // page number
    pub size: Option<usize>,    // page size
    pub search: Option<String>, // optional search term
}