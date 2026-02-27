use std::sync::Arc;


use casbin::{CoreApi, DefaultModel, Enforcer, FileAdapter};
use tokio::sync::mpsc;

use crate::{engine::AdminCommand, models::config::{Config, Middleware}, services::jwt_service::JwtService};

pub mod router;
pub mod controllers;
pub mod middleware;


#[derive(Clone)]
pub struct ApiState {
    pub jwt_service: JwtService,
    pub enforcer: Arc<Enforcer>,
    pub tx: mpsc::UnboundedSender<AdminCommand>,
}