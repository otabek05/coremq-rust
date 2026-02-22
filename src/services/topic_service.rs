use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;

#[derive(Debug, Default)]
pub struct TopicNode {
    children: HashMap<String, TopicNode>,
    subscribers: HashSet<String>,
}

#[derive(Debug, Default)]
pub struct TopicService {
    root: RwLock<TopicNode>,
}

impl TopicService {
    pub fn new() -> Self {
        Self {
            root: RwLock::new(TopicNode::default()),
        }
    }

    pub async fn subscribe(&self, topic: &str, client_id: &str) {
        let mut root = self.root.write().await;
        let mut current = &mut *root;
        for level in topic.split('/') {
            current = current
                .children
                .entry(level.to_string())
                .or_default();
        }
        current.subscribers.insert(client_id.to_string());
    }

    pub async fn unsubscribe(&self, topic: &str, client_id: &str) {
        let mut root = self.root.write().await;
        let levels: Vec<&str> = topic.split('/').collect();
        Self::remove_recursive(&mut root, &levels, client_id);
    }

    pub async fn match_subscribers(&self, topic: &str) -> Vec<String> {
        let root = self.root.read().await;
        let levels: Vec<&str> = topic.split('/').collect();
        let mut result = Vec::new();
        Self::match_recursive(&root, &levels, &mut result);
        result
    }

    pub async fn remove_client(&self, client_id: &str) {
        let mut root = self.root.write().await;
        Self::remove_client_recursive(&mut root, client_id);
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
        if let Some(child) = node.children.get(level) {
            Self::match_recursive(child, &levels[1..], result);
        }
        if let Some(child) = node.children.get("+") {
            Self::match_recursive(child, &levels[1..], result);
        }
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