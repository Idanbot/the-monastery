# ⛩️ TheMonastery

[![CI](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml/badge.svg)](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **A focused planning workspace for deep work.**
> TheMonastery combines a Kanban board, timeline planning, role and tag goals, analytics, profiles, imports, and a low-clutter Monk Mode in a single self-hosted app.

---

## ✨ Highlights

- **📋 Task Board:** Drag-and-drop, filters, recurring tasks, subtasks, notes, activity, and manual time logs.
- **📅 Full Calendar View:** Drag-and-drop scheduling capabilities with dedicated day columns for robust planning.
- **⏱️ Daily Timeline:** Scheduled blocks, drag-to-reschedule, current-time marker, and current-task controls.
- **🧘 Monk Mode:** A simplified focus surface and minimap for lower-clutter execution.
- **🎯 Role & Tag Goals:** Set and track daily, weekly, and monthly target hours.
- **Projects and Learning Tracks:** Group tasks, milestones, tags, and outcomes per profile.
- **📊 Analytics:** Task status, tracked time, role balance, tag hours, radar view, and activity trends.
- **🧠 Smart Task Creation:** Infer tags from task names and configured role/tag relationships.
- **🎨 Theme Gallery:** Liquid Glass, terminal, dark, and light styles plus simple color customization.
- **🗃️ Robust Data Management:** Profiles, local backup history, JSON import/export, profile import/export, planning import, and ICS import.
- **⌨️ Keyboard-First Workflow:** Command palette and intuitive shortcuts.

## 🏗️ Architecture

The application is built as a React frontend served by a Fastify API with SQLite persistence. The frontend utilizes a modern **Context-based architecture** (e.g., `TaskContext`, `SettingsContext`, `ProfileContext`, `UIContext`) for efficient global state management, avoiding heavy prop drilling.

| Layer             | Technology                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| **Frontend**      | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI                      |
| **Backend**       | Node.js 24, Fastify                                                       |
| **Storage**       | SQLite via better-sqlite3                                                 |
| **Charts / UI**   | Recharts, Lucide icons, Sonner notifications                              |
| **Testing**       | Vitest, Testing Library, Playwright                                       |
| **CI / Security** | GitHub Actions, CodeQL, Dependency Review, Trivy, Hadolint, Docker Buildx |

> **Note:** The frontend and backend are served from the same origin. Browser actions call relative `/api/...` routes, meaning reverse-proxy and tunnel deployments do not require CORS or a separate API hostname.

## 🚀 Quick Start

### Requirements

- **Node.js**: 24+
- **npm**: 11+
- **Docker & Docker Compose** (for container deployment)

### Local Development

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Run the frontend and API** (in separate terminals):

   ```sh
   npm run dev
   npm run dev:api
   ```

3. **Build and run production locally:**
   ```sh
   npm run build:all
   npm start
   ```

## 🐳 Docker Deployment

The default Docker deployment is designed for a small personal server. The runtime compose file uses the CI-built GHCR image and exposes the app only on `localhost`.

### Start the Runtime Stack

```sh
docker compose up -d
```

Access the app at: `http://127.0.0.1:8181`

### Configuration Details

`docker-compose.yml` uses:

- `ghcr.io/idanbot/the-monastery:latest` by default.
- `127.0.0.1:8181:3000` to prevent direct exposure on all interfaces.
- A persistent `the-monastery-data` volume mounted at `/data`.
- **Watchtower** with label-based targeting for auto-updating the app container.

> CI updates the `latest` image on the default branch. Watchtower checks every 5 minutes for a newer digest of that tag, pulls it, recreates the labeled app container, and removes old image layers.

### Advanced Deployments

**Pinned CI Image** (Deterministic Deploy):

```sh
THE_MONASTERY_IMAGE=ghcr.io/idanbot/the-monastery:sha-<commit> docker compose up -d
```

**Build Locally** (Instead of GHCR):

```sh
docker compose -f compose.local.yml up -d --build
```

_(Note: `compose.local.yml` builds `the-monastery:local` and intentionally omits Watchtower.)_

**Smoke-test a Built Image:**

```sh
npm run docker:smoke -- the-monastery:local
```

## 🌐 Remote Access

If Cloudflare Tunnel is running on the host, point your public hostname to `http://127.0.0.1:8181`.

**Recommended Production Posture:**

- Keep the Docker port bound to `127.0.0.1` only.
- Put Cloudflare Access (or another identity-aware proxy) in front of the hostname.
- Use one hostname for both the UI and `/api/*`.

_The app does not implement multi-user authentication. Your proxy acts as the authentication boundary._

### Optional owner token

For self-hosters who cannot put an identity-aware proxy in front, the server
supports an opt-in single-owner token. Set `THE_MONASTERY_OWNER_TOKEN` in the
environment and every `/api/*` route (except `/api/health`) will require a
matching `Authorization: Bearer <token>` (or `X-Owner-Token`) header. When the
token is configured the SPA shows a small unlock form on first load; the token
is stored in `localStorage` and attached to subsequent requests. Leave the env
var unset to keep the open-by-default behaviour.

```sh
THE_MONASTERY_OWNER_TOKEN=$(openssl rand -hex 32) docker compose up -d
```

Other request-hardening env vars:

- `THE_MONASTERY_BODY_LIMIT` — max request body size in bytes (default `1048576`, i.e. 1 MiB; oversized bodies return `413`).
- `THE_MONASTERY_API_RATE_LIMIT_MAX` / `THE_MONASTERY_API_RATE_LIMIT_WINDOW` — rate-limit settings for `/api/*`.

### Calendar and webhook integrations

Integrations are optional and configured only through server environment variables, so credentials are never stored in profile exports or browser storage. Open **Settings > Integrations** to pull calendar events into the import preview, push scheduled tasks to CalDAV, test alerts, or opt into automatic task alerts.

| Variable                                                              | Purpose                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| `THE_MONASTERY_ICS_SUBSCRIPTION_URLS`                                 | Comma- or newline-separated read-only ICS feed URLs    |
| `THE_MONASTERY_CALDAV_URL`                                            | CalDAV calendar collection URL used for REPORT and PUT |
| `THE_MONASTERY_CALDAV_USERNAME` / `THE_MONASTERY_CALDAV_PASSWORD`     | Optional CalDAV basic-auth credentials                 |
| `THE_MONASTERY_DISCORD_WEBHOOK_URL`                                   | Discord incoming webhook URL                           |
| `THE_MONASTERY_SLACK_WEBHOOK_URL`                                     | Slack incoming webhook URL                             |
| `THE_MONASTERY_TELEGRAM_BOT_TOKEN` / `THE_MONASTERY_TELEGRAM_CHAT_ID` | Telegram Bot API destination                           |

Example:

```sh
export THE_MONASTERY_ICS_SUBSCRIPTION_URLS="https://calendar.example/private.ics"
export THE_MONASTERY_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
docker compose up -d
```

Treat webhook URLs, bot tokens, and CalDAV passwords as secrets. CalDAV pushes overwrite matching task UID resources; calendar pulls always use the existing import preview before data is merged.

## 💾 Data & Backups

Server data resides in `THE_MONASTERY_DATA_DIR` (defaults to `/data` in Docker, backed by the `the-monastery-data` volume).

**Backup & Import Capabilities:**

- Local backup history via Settings.
- Task JSON export/import.
- Full profile export/import.
- Planning import (Tasks, Roles, Tags, Goals).
- ICS calendar import.

_Manual import schemas and examples can be found in `import/`._

## 🔄 Sync & Offline Architecture

The client and server cooperate through a revision-based optimistic-sync
protocol so the UI stays responsive while writes are debounced and serialised.

- **Independent revisions.** Each profile keeps separate `tasks_revision` and
  `settings_revision` counters. A settings save cannot invalidate a concurrent
  task save's base revision (and vice versa). Mutations send `baseRevision`;
  the server returns `409 { revision }` when it is stale, letting the client
  offer "Keep local changes" or "Use server version".
- **Serialised writes.** `src/domain/profileSyncQueue.ts` funnels every write
  through one promise chain per resource so a second writer cannot race ahead;
  the latest server revision is tracked and reused as the next base.
- **Offline mutation queue.** When a write is about to leave the browser,
  `src/domain/profileMutationQueue.ts` records it in `localStorage` first.
  If the request fails (or the browser is offline) the mutation survives a
  reload and is replayed against the freshly loaded profile on next boot.
- **Local fallback.** `useLocalFallbackPersistence` mirrors tasks and settings
  to IndexedDB (and a `localStorage` best-effort copy) so the app keeps working
  with no backend. When the server is reachable again the canonical server
  state wins; the IDB mirror is only consulted in offline/test mode to avoid
  clobbering fresh server data with a stale snapshot.
- **Delta writes.** `saveTasksDelta` diffs the previous baseline against the
  next snapshot and emits a single-task `POST`/`PATCH`/`DELETE` when exactly
  one task changed, falling back to a full `PUT` replace only for bulk changes.

See `src/hooks/useProfilesSync.ts` for the orchestration.

## 🧪 Verification & Testing

The system boasts comprehensive test coverage with **31 E2E tests**, **115 unit tests**, and strict performance budget checks. Tests employ robust context hook mocking, and persistence mechanisms gracefully handle non-browser test environments (e.g., Vitest).

Run the core CI checks locally:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build:all
npm run dockerfile:lint
```

Targeted test examples:

```sh
npm run test:e2e -- -g "theme gallery readable"
npm run test:e2e -- -g "drags scheduled"
docker compose config
docker compose -f compose.local.yml config
```

## 🔄 CI Notes

- **Dependency Review**: Runs on pull requests, comparing dependency changes against the base branch.
- **Docker Buildx**: Pushes GHCR images only outside pull requests.
- **Docker Compose Profiles**:
  - `docker-compose.yml`: Image-based runtime stack with Watchtower.
  - `compose.local.yml`: Local-build stack.
- **QEMU**: Image caching is disabled to avoid shared-cache reservation races for `tonistiigi/binfmt`.
