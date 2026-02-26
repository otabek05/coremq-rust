# CoreMQ

**CoreMQ** is a high-performance MQTT broker written in Rust using async Tokio.  
It is designed for scalability, reliability, and modern cloud-native deployments.

---

## 🚀 Overview

CoreMQ provides a fully asynchronous MQTT broker implementation with support for:

- Native TCP MQTT connections
- MQTT over WebSocket
- TLS encrypted communication
- REST API management
- Web-based dashboard
- CLI administration tools
- Built-in authentication & database
- External authentication and service integration

Built with:

- 🦀 Rust
- ⚡ Tokio (async runtime)
- 🌐 Axum (REST & WebSocket)
- 🔐 TLS support
- 🗄️ Database-backed authentication

---

## ✨ Features

### 🔌 MQTT Protocol Support
- MQTT 3.1.1 compliant
- TCP connections (default: `1883`)
- Secure TLS connections (`8883`)
- WebSocket MQTT (`/mqtt`)
- Ping / KeepAlive handling
- Publish / Subscribe / Unsubscribe
- QoS 0 (expandable to QoS 1/2)

---

### 🌍 Multi-Transport Support
CoreMQ supports:

- Native TCP
- TLS over TCP
- MQTT over WebSocket
- Secure WebSocket (WSS)

All transports share a unified async engine.

---

### 🔐 Authentication & Authorization

- Built-in authentication database
- Username & password validation
- Custom external authentication API support
- Pluggable auth backend
- Token-based or custom header support via REST

---

### 🗄️ Database Support

CoreMQ supports:

- Internal storage engine
- User management database
- Topic permissions
- Session persistence (optional)
- External database integration

---

### 📊 Dashboard

A built-in web dashboard allows:

- Connected clients monitoring
- Active subscriptions view
- Real-time message statistics
- User management
- Topic management
- Broker metrics

---

### 🔧 REST API

CoreMQ exposes REST endpoints for:

- Client management
- Force disconnect
- Publish message via HTTP
- User CRUD
- Broker status
- Metrics & monitoring
- Authentication service hooks

---

### 🖥️ CLI Tools

CoreMQ includes command-line utilities for:

- User creation
- Password management
- Topic permissions
- Broker configuration
- Diagnostics
- Publishing test messages

---

## 🏗️ Architecture

CoreMQ is built around a unified async engine:

```
Engine
 ├── TCP Transport
 ├── TLS Transport
 ├── WebSocket Transport
 ├── REST API Layer
 ├── Dashboard UI
 └── Authentication Service
```

All transports interact with a single shared broker core.

---

## ⚡ Performance

- Fully async (Tokio)
- Zero-cost abstractions
- Lock-minimized architecture
- Scalable across multi-core systems
- Designed for IoT-scale workloads

---

## 🔐 Security

- TLS support
- Secure WebSocket (WSS)
- Pluggable authentication
- Rate limiting ready
- Custom middleware support

---

## 🛠️ Installation

```bash
git clone https://github.com/otabek05/coremq.git
cd coremq
cargo build --release
```

Run:

```bash
cargo run
```

Default ports:

- MQTT TCP: `1883`
- MQTT TLS: `8883`
- WebSocket: `8083`
- REST API: `8080`

---

## 📡 Example Connection

### TCP
```bash
mosquitto_sub -h localhost -p 1883 -t test/topic
```

### WebSocket
```javascript
mqtt.connect("ws://localhost:8083/mqtt", {
  protocol: "mqtt"
});
```

---

## 📈 Roadmap

- MQTT v5 support
- Clustering
- Persistent storage engine
- Distributed mode
- Plugin system
- Prometheus metrics exporter

---

## 📄 License

MIT License

---

## 👨‍💻 Author

CoreMQ is developed as a modern Rust-based MQTT broker for scalable IoT systems.

---

## 🌟 Why CoreMQ?

- Rust safety guarantees
- Async-first design
- Multi-transport ready
- Built-in management tools
- Designed for production

---

**CoreMQ — Modern MQTT Broker Built in Rust**
