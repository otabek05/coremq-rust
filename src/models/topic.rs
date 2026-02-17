

use std::collections::{HashMap, HashSet};

use crate::brokers::tcp_broker::ClientID;

#[derive(Debug, Default)]
pub struct TopicNode {
    pub children: HashMap<String, TopicNode>,
    pub subscribers: HashSet<ClientID>,
}
