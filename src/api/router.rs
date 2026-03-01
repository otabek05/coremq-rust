use axum::{Router, http::StatusCode, response::Html, routing::{delete, get}};
use tower_http::cors::{Any, CorsLayer};


use crate::api::{ api_state::ApiState, controllers::{clients, listeners}};

pub struct  RouterHandler {}

impl RouterHandler  {
    pub fn new() -> Self {
        RouterHandler {  }
    }

    pub fn create_router(&self, state: ApiState) -> Router {
        Router::new()
        .nest("/api/v1", self.get_client_routes())
        .route("/api/v1/listeners", get(listeners::get_listeners))
        .route("/api/v1/listeners/:port", delete(listeners::stop_listener))
        .fallback(not_found)
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



async fn not_found() -> impl axum::response::IntoResponse {
    let html = r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Not Found</title>
            <style>
                body { font-family: Arial; text-align: center; margin-top: 100px; }
                h1 { font-size: 48px; color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Page not found</p>
        </body>
        </html>
    "#;

    (StatusCode::NOT_FOUND, Html(html))
}