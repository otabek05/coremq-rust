use std::sync::Arc;

use redb::{Database, ReadableTable, TableDefinition};
use anyhow::Result;

use crate::models::user::User;


pub const USERS: TableDefinition<&str, &[u8]> = TableDefinition::new("users");

#[derive(Clone)]
pub struct UserRepo {
    db: Arc<Database>,
}

impl UserRepo {
    pub fn new(db: Arc<Database>) -> Self {
        let write_txn = db.begin_write().expect("Failed to begin write txn for table init");
        let _ = write_txn.open_table(USERS).expect("Failed to create/open USERS table");
        write_txn.commit().expect("Failed to commit table init");
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


    pub fn get_all(&self) -> Result<Vec<User>> {
    let read_txn = self.db.begin_read()?;
    let table = read_txn.open_table(USERS)?;

    let mut users = Vec::new();

    for entry in table.iter()? {
        let (_key, value) = entry?;
        let user: User = bincode::deserialize(value.value())?;
        users.push(user);
    }

    Ok(users)
}
}