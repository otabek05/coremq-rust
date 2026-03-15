use axum::{Json, extract::State, http::StatusCode};
use crate::{api::api_state::{ApiResponse, ApiState}, enums::role::RoleType, models::{login::{Login, Token}, user::User}, utils::{self, password::hash_password}};


pub async fn create_user(
    State(state): State<ApiState>,
    Json(mut user): Json<User>,
) -> (StatusCode, Json<ApiResponse<User>>) {

    let hashed_password = match  hash_password(&user.password_hash) {
        Ok(passwd) => passwd,
        Err(e) => {
            return  (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(StatusCode::INTERNAL_SERVER_ERROR, e.to_string())));
        }
    };

    user.password_hash = hashed_password;

    match state.storage.user.create(&user) {
        Ok(()) => (
          
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::success(user, "successfully created"))
            
        ),

        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to fetch users: {}", e),
            ))
        )
    }
}
// delete user 

// login user 

pub async fn login(
    State(state): State<ApiState>,
    Json(data): Json<Login>,
)-> (StatusCode, Json<ApiResponse<Token>>) {
    let user = match state.storage.user.get(&data.username) {
        Ok(Some(user)) => user,
        _ => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error(StatusCode::BAD_REQUEST, "client not found")))
        
    };

    if !utils::password::verify(&data.password, &user.password_hash) {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error(StatusCode::BAD_REQUEST, "wrong password")));
    }

    let token = match state.jwt_service.generate(user.username, RoleType::Admin) {
        Ok(token) => token,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, Json(ApiResponse::error(StatusCode::BAD_REQUEST, e.to_string())));
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(token, "successfully created")))

    
}
// logout user 

// delete user

// get users
pub async fn get_all_users(
    State(state): State<ApiState>,
) -> (StatusCode, Json<ApiResponse<Vec<User>>>) {
    match state.storage.user.get_all() {
        Ok(users) => (
            StatusCode::OK,
            Json(ApiResponse::success(users, "Fetched all users successfully")),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to fetch users: {}", e),
            )),
        ),
    }
}
