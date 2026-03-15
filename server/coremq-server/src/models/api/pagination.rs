use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Page<T> {
    pub content: Vec<T>,
    pub page: usize,
    pub size: usize,
    pub total_elements: usize,
    pub total_pages: usize,
}