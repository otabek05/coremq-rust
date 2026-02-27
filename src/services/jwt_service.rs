use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode, errors::Error};

use crate::{enums::{jwt::JwtType, role::RoleType}, models::{claims::{self, Claims}, config, login::Token}};



#[derive(Clone)]
pub struct JwtService {
    encoding: EncodingKey,
    decoding: DecodingKey,
    validation: Validation,
}



impl JwtService {
    pub fn new(cfg: &config::Middleware) -> Self {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;
        Self { 
            encoding: EncodingKey::from_secret(cfg.secret.as_bytes()) , 
            decoding: DecodingKey::from_secret(cfg.secret.as_bytes()), 
            validation 
        }
    }

    pub fn generate(&self, user_id: u64, role:RoleType) -> Result<Token, Error> {
        let access_token = self.generate_token(user_id, JwtType::AccessToken, 3600, &role)?;
        let refresh_token = self.generate_token(user_id, JwtType::RefreshToken, 6200, &role)?;
        Ok(Token{
            access_token, refresh_token
        })
    }

    pub fn parse(&self, token: &str) ->Result<Claims, Error> {
        let data = decode(token,&self.decoding, &self.validation)?;
        Ok(data.claims)
    }


    fn generate_token(&self, user_id:u64, token_type:JwtType, ttl:i64, role:&RoleType) -> Result<String, Error> {
        let now = Utc::now();
        let claims = Claims{
            sub: user_id.to_string(),
            iat:now.timestamp() as usize,
            role: role.to_string(),
            exp: (now + Duration::seconds(ttl)).timestamp() as usize,
            token_type: token_type.to_string()
        };

        encode(&Header::default(), &claims, &self.encoding)
    }
}