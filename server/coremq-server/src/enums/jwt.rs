
pub enum JwtType {
    AccessToken, 
    RefreshToken
}

impl JwtType {
    pub fn as_str(&self) -> &'static str {
        match self {
            JwtType::AccessToken => "access_token",
            JwtType::RefreshToken => "refresh_token"
        }
    } 

    pub fn to_string(&self) -> String {
        self.as_str().to_owned()
    }
}