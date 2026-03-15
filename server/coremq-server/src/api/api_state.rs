use std::sync::Arc;

use axum::http::StatusCode;
use casbin::Enforcer;
use serde::Serialize;
use tokio::sync::mpsc;

use crate::{engine::AdminCommand, services::jwt::JwtService, storage::redb::Storage};

#[derive(Clone)]
pub struct ApiState {
    pub jwt_service: Arc<JwtService>,
    pub enforcer: Arc<Enforcer>,
    pub storage: Arc<Storage>,
    pub engine: mpsc::UnboundedSender<AdminCommand>,
}


#[derive(Serialize, Clone)]
pub struct ApiResponse<T> {
    pub status_code: u16,
    pub message: String,
    pub data: Option<T>,
}



impl<T> ApiResponse<T> {
    pub fn success(data: T, message: impl Into<String>) -> Self {
        Self {
            status_code: 200,
            message: message.into(),
            data: Some(data),
        }
    }

    pub fn error(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status_code: status.as_u16(),
            message: message.into(),
            data: None,
        }
    }
}