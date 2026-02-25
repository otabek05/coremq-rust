use std::collections::{HashMap, HashSet};

#[derive(Debug, Default)]
pub struct TopicNode {
    children: HashMap<String, TopicNode>,
    subscribers: HashSet<String>,
}

#[derive(Debug, Default)]
pub struct TopicService {
    root: TopicNode,
}

impl TopicService {
    pub fn new() -> Self {
        Self {
            root: TopicNode::default(),
        }
    }

    pub fn subscribe(&mut self, topic: &str, client_id: &str) {
        let mut current = &mut self.root;

        for level in topic.split('/') {
            current = current
                .children
                .entry(level.to_string())
                .or_default();
        }

        current.subscribers.insert(client_id.to_string());
    }

    pub fn unsubscribe(&mut self, topic: &str, client_id: &str) {
        let levels: Vec<&str> = topic.split('/').collect();
        Self::remove_recursive(&mut self.root, &levels, client_id);
    }

    pub fn match_subscribers(&self, topic: &str) -> Vec<String> {
        let levels: Vec<&str> = topic.split('/').collect();
        let mut result = Vec::new();
        Self::match_recursive(&self.root, &levels, &mut result);
        result
    }

    pub fn remove_client(&mut self, client_id: &str) {
        Self::remove_client_recursive(&mut self.root, client_id);
    }

    fn remove_recursive(node: &mut TopicNode, levels: &[&str], client_id: &str) -> bool {
        if levels.is_empty() {
            node.subscribers.remove(client_id);
        } else if let Some(child) = node.children.get_mut(levels[0]) {
            let should_delete = Self::remove_recursive(child, &levels[1..], client_id);
            if should_delete {
                node.children.remove(levels[0]);
            }
        }

        node.children.is_empty() && node.subscribers.is_empty()
    }

    fn match_recursive(node: &TopicNode, levels: &[&str], result: &mut Vec<String>) {
        if levels.is_empty() {
            result.extend(node.subscribers.iter().cloned());
            return;
        }

        let level = levels[0];

        // Exact match
        if let Some(child) = node.children.get(level) {
            Self::match_recursive(child, &levels[1..], result);
        }

        // Single-level wildcard "+"
        if let Some(child) = node.children.get("+") {
            Self::match_recursive(child, &levels[1..], result);
        }

        // Multi-level wildcard "#"
        if let Some(child) = node.children.get("#") {
            result.extend(child.subscribers.iter().cloned());
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