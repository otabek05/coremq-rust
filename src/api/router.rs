use axum::{Router, routing::{ get}};
use tower_http::cors::{Any, CorsLayer};

use crate::{api::{app_state::ApiState, controllers::clients}};

pub struct  RouterHandler {}

impl RouterHandler  {
    pub fn new() -> Self {
        RouterHandler {  }
    }

    pub fn create_router(&self, state: ApiState) -> Router {
        Router::new()
        .nest("/api/v1", self.get_client_routes())
        .layer(self.cors())
        .with_state(state)
        
    }


    pub fn get_client_routes(&self) -> Router<ApiState> {
        Router::new()
        .route("/clients", get(clients::get_clients))
    }

     fn cors(&self) -> CorsLayer {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    }
}