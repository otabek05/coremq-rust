

use std::collections::{HashMap, HashSet};

pub type ClientID = String;
pub type Topic = String;

#[derive(Debug, Default)]
pub struct TopicNode {
    pub children: HashMap<String, TopicNode>,
    pub subscribers: HashSet<ClientID>,
}
