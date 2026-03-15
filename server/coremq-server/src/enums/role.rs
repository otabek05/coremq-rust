

pub enum  RoleType {
    Admin,
    User
}


impl RoleType {
    pub fn as_str(&self) -> &'static str {
        match self {
            RoleType::Admin => "admin",
            RoleType::User => "user",
        }
    }

    pub fn to_string(&self) -> String {
        self.as_str().to_owned()
    }
}