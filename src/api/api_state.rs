use std::sync::Arc;

use casbin::Enforcer;
use tokio::sync::mpsc;

use crate::{engine::AdminCommand, services::jwt_service::JwtService};



#[derive(Clone)]
pub struct ApiState {
    pub jwt_service: Arc<JwtService>,
    pub enforcer: Arc<Enforcer>,
    pub tx: mpsc::UnboundedSender<AdminCommand>,
}