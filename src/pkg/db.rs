use std::sync::Arc;

use redb::Database;

#[derive(Clone)]
pub struct ReDB {
    pub db: Arc<Database>,
}

impl ReDB {
    pub fn new(path: &str) -> anyhow::Result<Self> {
        let db = Database::create(path)?;
        Ok(Self { db: Arc::new(db) })
    }
}