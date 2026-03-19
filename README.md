# CoreMQ

**CoreMQ** is a high-performance MQTT broker written in Rust using async Tokio.
It is designed for scalability, reliability, and modern cloud-native deployments.

---

## Overview

CoreMQ provides a fully asynchronous MQTT broker implementation with support for:

- Native TCP MQTT connections
- MQTT over WebSocket
- TLS encrypted communication
- REST API management
- Web-based admin dashboard
- Built-in authentication & database (ReDB)
- Role-based access control (Casbin RBAC)
- Topic monitoring & REST publish
- Multi-language dashboard (EN, KO, UZ)

Built with:

- Rust
- Tokio (async runtime)
- Axum (REST & WebSocket)
- ReDB (embedded database)
- Casbin (RBAC authorization)
- React + Material-UI (dashboard)

---

## Features

### MQTT Protocol Support
- MQTT 3.1.1 compliant
- TCP connections (default: `1883`)
- Secure TLS connections (`8883`)
- WebSocket MQTT (`/mqtt` on port `8083`)
- Ping / KeepAlive handling
- Publish / Subscribe / Unsubscribe
- Wildcard topic matching (`+` and `#`)
- QoS 0 (expandable to QoS 1/2)

---

### Multi-Transport Support
CoreMQ supports:

- Native TCP
- TLS over TCP
- MQTT over WebSocket
- Secure WebSocket (WSS)

All transports share a unified async engine.

---

### Authentication & Authorization

- Built-in user database (ReDB)
- Username & password validation (Argon2 hashing)
- JWT access & refresh tokens
- Casbin role-based access control (Admin / User roles)
- Middleware-based route protection

---

### REST API

CoreMQ exposes REST endpoints on port `18083`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/public/login` | User login (returns JWT tokens) |
| `GET` | `/api/v1/sessions` | List connected clients (paginated) |
| `DELETE` | `/api/v1/sessions/:client_id` | Force disconnect a client |
| `GET` | `/api/v1/users` | List all users |
| `POST` | `/api/v1/users` | Create a new user |
| `GET` | `/api/v1/listeners` | List active listeners |
| `DELETE` | `/api/v1/listeners/:port` | Stop a listener |
| `GET` | `/api/v1/topics` | List all active topics with subscriber counts |
| `POST` | `/api/v1/publish` | Publish a message to a topic via HTTP |

---

### Topic Monitoring & REST Publish

CoreMQ provides full topic visibility and REST-based message publishing:

- **Topic listing** — View all active topics with real-time subscriber counts
- **REST publish** — Send messages to any topic directly from the admin dashboard or via HTTP API without needing an MQTT client connection

**Why this matters:**
- IoT fleet operators can send commands to devices directly from the dashboard
- Developers can test subscriptions without setting up an MQTT client
- Monitoring teams can see which topics are active and how many subscribers each has
- Integrations can publish via simple HTTP POST instead of maintaining MQTT connections

**REST Publish example:**
```bash
curl -X POST http://localhost:18083/api/v1/publish \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"topic": "devices/sensor/temperature", "payload": "{\"temp\": 23.5}", "qos": 0, "retain": false}'
```

**Topics API example:**
```bash
curl http://localhost:18083/api/v1/topics \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "status_code": 200,
  "message": "successfully fetched topics",
  "data": [
    { "topic": "devices/sensor/temperature", "subscriber_count": 3 },
    { "topic": "home/livingroom/light", "subscriber_count": 1 }
  ]
}
```

---

### Admin Dashboard

A built-in web dashboard (React + Material-UI) running on port `18083`:

- **Home** — Overview analytics
- **Sessions** — Connected clients monitoring, search, disconnect
- **Topics** — Active topics with subscriber counts, publish messages to any topic
- **Listeners** — Active listener management
- **WebSocket Client** — Built-in MQTT WebSocket client for testing
- **Webhooks** — Webhook management (coming soon)
- **Admin** — User management (create, list, role assignment)
- **Authentication** — JWT login with token refresh
- **Multi-language** — English, Korean, Uzbek

---

## Architecture

CoreMQ is built around a unified async engine with channel-based communication:

```
                    ┌──────────────────────────────┐
                    │         Admin Dashboard       │
                    │     (React + Material-UI)     │
                    └──────────────┬───────────────┘
                                   │ HTTP (port 18083)
                    ┌──────────────▼───────────────┐
                    │       REST API (Axum)         │
                    │  Sessions │ Topics │ Users    │
                    │  Listeners│Publish │ Auth     │
                    └──────────────┬───────────────┘
                                   │ mpsc channels
                    ┌──────────────▼───────────────┐
                    │        Engine (Tokio)         │
                    │   ┌─────────┐ ┌───────────┐  │
                    │   │ Session │ │   Topic   │  │
                    │   │ Service │ │  Service  │  │
                    │   └─────────┘ └───────────┘  │
                    └──┬─────────┬─────────┬───────┘
                       │         │         │
               ┌───────▼──┐ ┌───▼────┐ ┌──▼────────┐
               │  TCP      │ │  TLS   │ │ WebSocket │
               │ (1883)    │ │ (8883) │ │  (8083)   │
               └───────────┘ └────────┘ └───────────┘
```

All transports and the REST API communicate with the engine through async mpsc channels. The engine processes commands (Connect, Disconnect, Subscribe, Unsubscribe, Publish, GetTopics, etc.) in a single event loop.

---

## Installation

```bash
git clone https://github.com/otabek05/coremq.git
cd coremq
cargo build --release
```

Run the broker:

```bash
cargo run
```

Run the dashboard (in a separate terminal):

```bash
cd client
npm install
npm run dev
```

Default ports:

| Service | Port |
|---------|------|
| MQTT TCP | `1883` |
| MQTT TLS | `8883` |
| WebSocket | `8083` |
| REST API + Dashboard | `18083` |

Default admin credentials: `admin` / `public`

---

## Example Connection

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

### REST Publish
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:18083/api/v1/public/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "public"}' | jq -r '.data.access_token')

# Publish a message
curl -X POST http://localhost:18083/api/v1/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic": "test/topic", "payload": "hello world", "qos": 0, "retain": false}'
```

---

## Performance

- Fully async (Tokio)
- Zero-cost abstractions
- Lock-minimized architecture (DashMap for concurrent access)
- Scalable across multi-core systems
- Designed for IoT-scale workloads

---

## Security

- TLS support
- Secure WebSocket (WSS)
- Argon2 password hashing
- JWT token authentication with refresh
- Casbin RBAC authorization
- CORS middleware

---

## Roadmap

- MQTT v5 support
- QoS 1 and QoS 2
- Clustering
- Persistent storage engine
- Distributed mode
- Plugin system
- Prometheus metrics exporter
- Retained message management
- ACL-based topic permissions

---

## License

MIT License

---

**CoreMQ — Modern MQTT Broker Built in Rust**
