use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use password_hash::SaltString;
use rand_core::OsRng;




pub fn hash_password(password:&str) -> Result<String,argon2::password_hash::Error > {
    let salt = SaltString::generate(&mut OsRng);
    let argon2  = Argon2::default();
    let password_hashed = argon2.hash_password(password.as_bytes(), &salt)?;

    Ok(password_hashed.to_string())
}

pub fn verify( password: &str, hashed_password: &str) -> Result<bool, argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(hashed_password)?;

    Ok(Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok())
}