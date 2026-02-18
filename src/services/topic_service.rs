use std::collections::{HashMap, HashSet};


#[derive(Debug, Default)]
pub struct TopicNode {
    pub children: HashMap<String, TopicNode>,
    pub subscribers: HashSet<String>,
}

#[derive(Debug, Default)]
pub struct TopicService  {
    pub root: TopicNode,
}


impl TopicService {
    pub fn new() -> Self {
        Self { root: TopicNode::default() }
    }

    pub fn subscribe(&mut self, topic: &str, client_id:&str) {
        let mut  current = &mut self.root;
        for level in topic.split('/') {
            current = current.children.entry(level.to_string()).or_default();
        }

        current.subscribers.insert(client_id.to_string());
    }

    pub fn unsubscribe(&mut self, topic: &str, client_id: &str) {
        let levels: Vec<&str> = topic.split('/').collect();
        Self::remove_recursive(&mut self.root, &levels, client_id);
    }

     pub fn match_subscribers(&self, topic: &str) -> HashSet<String> {
        let mut result = HashSet::new();
        let levels: Vec<&str> = topic.split('/').collect();
        Self::match_recursive(&self.root, &levels, &mut result);
        result
    }

    pub fn remove_client(&mut self, client_id: &str) {
        Self::remove_client_recursive(&mut self.root, client_id);
    }

    fn remove_recursive(node: &mut TopicNode, levels: &[&str], client_id:&str) -> bool {
        if levels.is_empty() {
            node.subscribers.remove(client_id);
        }else if let Some(child) = node.children.get_mut(levels[0]) {
            let should_delete = Self::remove_recursive(child, &levels[1..], client_id);
            if should_delete {
                node.children.remove(client_id);
            }
        }

        node.children.is_empty() && node.subscribers.is_empty()
    }

    fn match_recursive(node: &TopicNode, levels: &[&str], result: &mut HashSet<String>) {
        if levels.is_empty() {
            result.extend(node.subscribers.iter().cloned());
            return;
        }

        if let Some(plus) = node.children.get(levels[0]) {
            Self::match_recursive(plus, &levels[1..], result);
        }

        if let Some(plus) = node.children.get("+") {
            Self::match_recursive(plus, &levels[1..], result);
        }

        if let Some(hash) = node.children.get("#") {
            result.extend(hash.subscribers.iter().cloned());
        }
    }

      fn remove_client_recursive(node: &mut TopicNode, client_id: &str) -> bool {
        node.subscribers.remove(client_id);
        let mut empty_children = Vec::new();
        for (key, child) in node.children.iter_mut() {
            if Self::remove_client_recursive(child, client_id) {
                empty_children.push(key.clone());
            }
        }
        for key in empty_children {
            node.children.remove(&key);
        }
        node.subscribers.is_empty() && node.children.is_empty()
    }
}