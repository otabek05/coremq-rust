use std::sync::Arc;

use redb::Database;

use crate::storage::redb::user::UserRepo;

pub mod user;

#[derive(Clone)]
pub struct Storage {
    pub user: UserRepo
}


impl Storage {
    pub fn new(db: Arc<Database>) -> Self {
        Self { user: UserRepo::new(db) }
    }
}