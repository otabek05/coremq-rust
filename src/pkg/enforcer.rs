use casbin::{CoreApi, DefaultModel, Enforcer, Error, FileAdapter};

use crate::models::config::Middleware;

pub async  fn new(cfg: Middleware) -> Result<Enforcer, Error> {
    let model = DefaultModel::from_file(cfg.model_path).await?;
    let adapter = FileAdapter::new(cfg.policy_path);
    let mut enforcer = Enforcer::new(model, adapter).await?;

    enforcer.load_policy().await?;
    Ok(enforcer)
}