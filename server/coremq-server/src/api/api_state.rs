use std::sync::{Arc, atomic::{AtomicU16, Ordering}};

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
    pub packet_id_counter: Arc<AtomicU16>,
}

impl ApiState {
    /// Returns the next packet ID (1–65535), wrapping around and skipping 0.
    pub fn next_packet_id(&self) -> u16 {
        loop {
            let id = self.packet_id_counter.fetch_add(1, Ordering::Relaxed);
            if id != 0 {
                return id;
            }
        }
    }
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