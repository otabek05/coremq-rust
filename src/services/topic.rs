use dashmap::{DashMap, DashSet};
use std::sync::Arc;

#[derive(Debug, Default)]
pub struct TopicNode {
    children: DashMap<String, Arc<TopicNode>>,
    subscribers: DashSet<String>,
}

#[derive(Debug, Default)]
pub struct TopicService {
    root: Arc<TopicNode>,
}

impl TopicService {
    pub fn new() -> Self {
        Self {
            root: Arc::new(TopicNode::default()),
        }
    }

    pub fn subscribe(&self, topic: &str, client_id: &str) {
        let mut current = Arc::clone(&self.root);

        for level in topic.split('/') {
            current = {
                // Access the children map and ensure it is inserted if not already present
                let node = current.children.entry(level.to_string())
                    .or_insert_with(|| Arc::new(TopicNode::default()))
                    .clone();
                
                node
            };
        }

        // Add the client to the subscribers list for the current topic
        current.subscribers.insert(client_id.to_string());
    }

    pub fn unsubscribe(&self, topic: &str, client_id: &str) {
        let levels: Vec<&str> = topic.split('/').collect();
        self.remove_recursive(&self.root, &levels, client_id);
    }

    pub fn match_subscribers(&self, topic: &str) -> Vec<String> {
        let levels: Vec<&str> = topic.split('/').collect();
        let mut result = Vec::new();
        self.match_recursive(&self.root, &levels, &mut result);
        result
    }

    pub fn remove_client(&self, client_id: &str) {
        self.remove_client_recursive(&self.root, client_id);
    }

    fn remove_recursive(&self, node: &Arc<TopicNode>, levels: &[&str], client_id: &str) -> bool {
        if levels.is_empty() {
            node.subscribers.remove(client_id);
        } else if let Some(child) = node.children.get(levels[0]) {
            let should_delete = self.remove_recursive(&child, &levels[1..], client_id);
            if should_delete {
                node.children.remove(levels[0]);
            }
        }

        node.children.is_empty() && node.subscribers.is_empty()
    }

    fn match_recursive(&self, node: &Arc<TopicNode>, levels: &[&str], result: &mut Vec<String>) {
        if levels.is_empty() {
            result.extend(node.subscribers.iter().map(|r| r.clone()));
            return;
        }

        let level = levels[0];

        if let Some(child) = node.children.get(level) {
            self.match_recursive(&child, &levels[1..], result);
        }

        if let Some(child) = node.children.get("+") {
            self.match_recursive(&child, &levels[1..], result);
        }

        if let Some(child) = node.children.get("#") {
            result.extend(child.subscribers.iter().map(|r| r.clone()));
        }
    }

    fn remove_client_recursive(&self, node: &Arc<TopicNode>, client_id: &str) -> bool {
        node.subscribers.remove(client_id);

        let mut empty_children = Vec::new();

        for r in node.children.iter() {
            if self.remove_client_recursive(r.value(), client_id) {
                empty_children.push(r.key().clone());
            }
        }

        for key in empty_children {
            node.children.remove(&key);
        }

        node.subscribers.is_empty() && node.children.is_empty()
    }
}