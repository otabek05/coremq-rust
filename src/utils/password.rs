use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use password_hash::SaltString;
use rand_core::OsRng;


pub fn hash_password(password:&str) -> Result<String,argon2::password_hash::Error > {
    let salt = SaltString::generate(&mut OsRng);
    let argon2  = Argon2::default();
    let password_hashed = argon2.hash_password(password.as_bytes(), &salt)?;

    Ok(password_hashed.to_string())
}


pub fn verify(password: &str, hashed_password: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hashed_password) {
        Ok(hash) => hash,
        Err(_) => return false, // invalid hash format
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}