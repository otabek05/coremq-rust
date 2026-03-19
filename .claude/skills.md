# CoreMQ Development Guide

Development guide for the CoreMQ MQTT broker project. Covers Rust backend conventions, React frontend architecture, API patterns, state management, and code standards.

---

## Project Overview

CoreMQ is a high-performance MQTT broker written in Rust with a React admin dashboard. The codebase is split into two parts:

| Part | Path | Stack |
|------|------|-------|
| Backend | `server/coremq-server/src/` | Rust, Tokio, Axum, ReDB, Casbin |
| Frontend | `client/src/` | React 19, TypeScript, MUI 7, Zustand, Vite |

---

## Code Conventions (REQUIRED)

### TypeScript

- **`type` over `interface`** — Always use `type` for type definitions. The only exception is `extend-theme-types.d.ts` where TypeScript requires `interface` for MUI module augmentation.
- **`export default function`** — All page and section components use `export default function ComponentName()`.
- **JSDoc comments only** — Use `/** */` for all comments. Never use `//` or `/* */`.
- **Single quotes** — Enforced by prettier. All strings use single quotes.
- **Trailing commas** — Enforced by prettier (`trailingComma: "all"`).

### Rust

- **Block comments only** — Use `/* */` for all comments in Rust source files.
- **No unnecessary comments** — Code should be self-documenting. Only comment non-obvious logic.
- **Consistent naming** — snake_case for functions/variables, PascalCase for types/structs.

---

## Frontend Architecture

### Directory Structure

```
client/src/
├── pages/              — Page wrappers (thin, just import section view)
├── sections/           — Feature views (UI + logic)
│   ├── home/           — Dashboard: stat_card, recent_clients, topics_overview
│   ├── session/        — Session management
│   ├── topics/         — Topic table, publish drawer
│   ├── listeners/      — Listener management
│   ├── admin/view/     — User management
│   ├── websocket/      — MQTT WebSocket client
│   └── auth/           — Sign-in form
├── stores/             — Zustand state management
├── services/           — API call functions (axios)
├── types/              — TypeScript type definitions
├── layouts/            — Dashboard layout, navigation, header
├── routes/             — React Router configuration
├── components/         — Shared components (iconify, scrollbar, logo)
├── theme/              — MUI dark theme configuration
└── 118n/               — Translations (en.json, ko.json, uz.json)
```

### Page Pattern

Every page follows this structure:

```tsx
/** pages/feature.tsx — thin wrapper */
import FeatureView from 'src/sections/feature/feature_view';

export default function FeaturePage() {
  return <FeatureView />;
}
```

```tsx
/** sections/feature/feature_view.tsx — orchestrator */
export default function FeatureView() {
  const { data, loading, error, fetch } = useFeatureStore();
  const [uiState, setUiState] = useState(false);

  useEffect(() => { fetch(); }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header with title + action buttons */}
      {/* Error alert */}
      {/* Loading / Empty / Data content */}
      {/* Drawer or Dialog for actions */}
    </Box>
  );
}
```

### Component Splitting Rules

- **View file** — Orchestrates state, data fetching, layout. Imports child components.
- **Table component** — Receives data via props, renders table. Calls `onAction(item)` callbacks.
- **Drawer/Dialog component** — Manages its own form state internally. Receives `open`, `onClose`, and initial data via props.

---

## State Management (Zustand)

### Store Structure

Every store follows this pattern:

```typescript
import { create } from 'zustand';

/** State shape (data only) */
type FeatureState = {
  items: Item[];
  loading: boolean;
  error: string | null;
};

/** Actions (functions only) */
type FeatureActions = {
  fetch: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
};

const initialState: FeatureState = {
  items: [],
  loading: false,
  error: null,
};

export const useFeatureStore = create<FeatureState & FeatureActions>((set, get) => ({
  ...initialState,
  fetch: async () => { /* ... */ },
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

/** Selectors */
export const selectItems = (s: FeatureState & FeatureActions) => s.items;
```

### Store Rules

- **Separate State and Actions types** — State is data, Actions is functions.
- **`initialState` object** — Shared between default values and `reset()`.
- **Every store has `reset()`** — For logout cleanup.
- **Export selectors** — Components subscribe to only what they need.
- **Barrel export** — `stores/index.ts` re-exports all stores and selectors.

### What Goes in Stores vs Local State

| Zustand (shared data) | Local useState (UI only) |
|------------------------|--------------------------|
| Sessions, topics, listeners, users | Drawer open/close |
| Pagination state | Search input value |
| Loading and error states | Selected item |
| Computed values (totalSubscriptions) | Form field values |
| | Snackbar messages |

---

## API Layer

### Service Pattern

```typescript
/** services/feature.ts */
import { api } from './axios';
import type { ApiResponse } from 'src/types/api_response';
import type { Feature } from 'src/types/feature';

export async function fetchFeatures(): Promise<ApiResponse<Feature[]>> {
  const res = await api.get<ApiResponse<Feature[]>>('/api/v1/features');
  return res.data;
}
```

### Axios Instance

- Base URL: `http://{hostname}:18083`
- Bearer token auto-attached via request interceptor
- 401 responses trigger automatic token refresh
- Failed refresh triggers logout (clear cookies + reload)
- Token constants and cookie helpers are centralized

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/public/login` | User login |
| `GET` | `/api/v1/sessions` | List sessions (paginated) |
| `DELETE` | `/api/v1/sessions/:client_id` | Disconnect client |
| `GET` | `/api/v1/topics` | List active topics |
| `POST` | `/api/v1/publish` | Publish message to topic |
| `GET` | `/api/v1/users` | List users |
| `POST` | `/api/v1/users` | Create user |
| `GET` | `/api/v1/listeners` | List listeners |
| `DELETE` | `/api/v1/listeners/:port` | Stop listener |

---

## Rust Backend Architecture

### Engine Command Pattern

All API controllers communicate with the engine via async mpsc channels:

```
Controller → AdminCommand (via channel) → Engine → Service → Response (via oneshot)
```

1. Controller creates a `oneshot::channel()` for the reply.
2. Sends an `AdminCommand` variant with the reply sender.
3. Engine `match`es the command, calls the appropriate service.
4. Engine sends the result back through the oneshot sender.
5. Controller awaits the reply and returns JSON.

### Adding a New Feature (Backend)

1. **Model** — Create struct in `models/api/` with `Serialize`/`Deserialize`.
2. **Command** — Add variant to `AdminCommand` in `engine/commands.rs`.
3. **Service method** — Add method to the relevant service in `services/`.
4. **Engine handler** — Add `match` arm in `engine/engine.rs` `run()` loop.
5. **Controller** — Create handler in `api/controllers/`.
6. **Route** — Register in `api/router.rs`.
7. **Module registration** — Add `pub mod` in `mod.rs` files.

### Key Rust Files

| File | Purpose |
|------|---------|
| `engine/engine.rs` | Core event loop, processes all commands |
| `engine/commands.rs` | `AdminCommand`, `PubSubCommand`, `ConnectCommand` enums |
| `services/session.rs` | Session management (DashMap) |
| `services/topic.rs` | Topic tree with wildcard matching |
| `services/jwt.rs` | JWT token generation and parsing |
| `api/router.rs` | Route definitions |
| `api/api_state.rs` | Shared API state and `ApiResponse` wrapper |

---

## Theme & Styling

### Dark Theme (MUI)

- Background: `#0B0F19` (default), `#131825` (paper), `#1A2035` (neutral)
- Text: `#E2E8F0` (primary), `#94A3B8` (secondary), `#475569` (disabled)
- Primary: `#00A76F` (green)
- Borders: `rgba(148,163,184,0.08)` to `rgba(148,163,184,0.15)`
- Font: `JetBrains Mono Variable` for monospace content (client IDs, topics, ports)

### Styling Rules

- **Never hardcode colors outside theme** — Use MUI `sx` prop with theme tokens.
- **Responsive** — Always use `{ xs: ..., sm: ... }` breakpoints for padding and layout.
- **Cards** — Use MUI `Card` component. Drawers use `bgcolor: '#131825'`.

---

## i18n

All user-facing text must use `t('key')` from `useTranslation()`. Translation files:

- `118n/en.json` — English
- `118n/ko.json` — Korean
- `118n/uz.json` — Uzbek

When adding a new feature, add translations to ALL three files.

---

## Development Commands

```bash
# Frontend
cd client
npm run dev          # Dev server (port 3039)
npm run build        # Production build
npm run fm:fix       # Prettier format all files
npm run lint:fix     # ESLint fix
npm run fix:all      # Lint + format

# Backend
cd server/coremq-server
cargo build          # Build
cargo run            # Run broker
```

### Default Ports

| Service | Port |
|---------|------|
| MQTT TCP | `1883` |
| MQTT TLS | `8883` |
| WebSocket | `8083` |
| REST API | `18083` |
| Frontend dev | `3039` |

### Default Credentials

Username: `admin` / Password: `public`
