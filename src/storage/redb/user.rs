use std::sync::Arc;

use redb::{Database, TableDefinition};
use anyhow::Result;

use crate::models::user::User;


pub const USERS: TableDefinition<&str, &[u8]> = TableDefinition::new("users");

pub struct UserRepo {
    db: Arc<Database>,
}

impl UserRepo {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn create(&self, user: &User) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(USERS)?;
            let bytes = bincode::serialize(user)?;
            table.insert(user.username.as_str(), bytes.as_slice())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    pub fn get(&self, username: &str) -> Result<Option<User>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(USERS)?;
        if let Some(value) = table.get(username)? {
            let user: User = bincode::deserialize(value.value())?;
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    pub fn delete(&self, username: &str) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(USERS)?;
            table.remove(username)?;
        }
        write_txn.commit()?;
        Ok(())
    }
}