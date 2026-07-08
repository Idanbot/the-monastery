# The Monastery

[![CI](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml/badge.svg)](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

The Monastery is a self-hosted planning workspace for focused work. It combines task management, day planning, goals, analytics, and a low-clutter focus mode in one responsive application.

The project is designed primarily for a single owner. It runs as a React application and Fastify API on one origin, with SQLite providing durable local storage.

## Features

- **Planning:** Kanban layouts, free task ordering, collapsible lanes, timeline scheduling, and day/week calendar views.
- **Task detail:** Notes, subtasks, tags, recurring tasks, activity history, time logs, and smart tag suggestions.
- **Focus:** Monk Mode, current and next task controls, daily planning, and role/tag targets.
- **Mobile:** Dedicated Today, Board, Calendar, quick-create, More navigation, and card-level Start/Done/Reject actions optimized for small screens.
- **Organization:** Profiles, roles, projects, learning tracks, milestones, and daily, weekly, or monthly goals.
- **Search and analytics:** SQLite FTS5 search across task content and dashboards for status, time, roles, tags, and trends.
- **Themes:** Light, dark, terminal, and Liquid Glass themes with configurable colors and effects.
- **Data portability:** Task, planning, profile, and ICS import; task and profile export; local backup history.
- **Integrations:** Read-only ICS subscriptions, CalDAV publishing, and optional Discord, Slack, or Telegram alerts.
- **Reliability:** Revision-aware synchronization, queued writes, local fallback persistence, health checks, and log rotation.

## Technology

| Area            | Stack                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI                      |
| API             | Node.js 24, Fastify                                                       |
| Storage         | SQLite via better-sqlite3, including FTS5 search                          |
| UI and charts   | Lucide, Recharts, Sonner                                                  |
| Validation      | Zod, React Hook Form                                                      |
| Testing         | Vitest, Testing Library, Playwright, axe-core                             |
| CI and security | GitHub Actions, CodeQL, Dependency Review, Trivy, Hadolint, Docker Buildx |

The frontend calls relative `/api/*` routes. UI and API therefore remain on the same origin behind Docker, a reverse proxy, or Cloudflare Tunnel, without a separate public API hostname.

## Quick Start

### Requirements

- Node.js 24 or newer
- npm
- Docker with Compose, for container deployment

### Development

Install dependencies:

```sh
npm install
```

Run the API and frontend in separate terminals:

```sh
npm run dev:api
```

```sh
npm run dev
```

Vite proxies `/api` requests to `http://127.0.0.1:3000` by default. Override this with `THE_MONASTERY_API_URL` when required.

Build and run the production server locally:

```sh
npm run build:all
npm start
```

### Docker

The default Compose stack pulls the CI-built image, binds it to localhost, persists SQLite data, rotates logs, and runs Watchtower for labeled image updates.

```sh
docker compose pull
docker compose up -d
```

Open `http://127.0.0.1:8181`.

If the GHCR package is private, authenticate first with a GitHub token that has `read:packages`:

```sh
echo "$GHCR_TOKEN" | docker login ghcr.io -u idanbot --password-stdin
```

Useful operational commands:

```sh
docker compose ps
docker compose logs -f the-monastery
docker compose pull
docker compose up -d
```

To build the image locally instead of pulling from GHCR:

```sh
docker compose -f compose.local.yml up -d --build
```

The local stack builds `the-monastery:local` and intentionally omits Watchtower.

To run a specific CI image:

```sh
THE_MONASTERY_IMAGE=ghcr.io/idanbot/the-monastery:sha-<commit> docker compose up -d
```

## Configuration

Compose reads variables from the shell or a local `.env` file. Start with the committed template, then keep secrets only in `.env`:

```sh
cp .env.example .env
```

Secret-bearing `.env` files are ignored by Git.

### Server and security

| Variable                              | Default                           | Purpose                                                            |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `THE_MONASTERY_DATA_DIR`              | `/data` in Docker                 | Directory containing the SQLite database                           |
| `THE_MONASTERY_DB_PATH`               | `<data-dir>/the-monastery.sqlite` | Optional database file override outside the standard Compose setup |
| `THE_MONASTERY_OWNER_TOKEN`           | unset                             | Enables the single-owner API token gate                            |
| `THE_MONASTERY_BODY_LIMIT`            | `1048576`                         | Maximum request body size in bytes                                 |
| `THE_MONASTERY_API_RATE_LIMIT_MAX`    | `300`                             | Requests permitted during each rate-limit window                   |
| `THE_MONASTERY_API_RATE_LIMIT_WINDOW` | `1 minute`                        | Fastify rate-limit window                                          |
| `LOG_LEVEL`                           | `info`                            | Fastify log level                                                  |

Generate and enable an owner token:

```sh
THE_MONASTERY_OWNER_TOKEN=$(openssl rand -hex 32) docker compose up -d
```

When enabled, all `/api/*` routes except `/api/health` require the token. The browser presents an unlock form and stores the token in local storage for subsequent requests.

For internet access, keep port `8181` bound to `127.0.0.1` and put Cloudflare Access or another identity-aware proxy in front of it. The owner token is a useful additional gate, but it is not a multi-user account system.

### Calendar and messaging integrations

| Variable                              | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `THE_MONASTERY_ICS_SUBSCRIPTION_URLS` | Comma- or newline-separated read-only ICS feed URLs    |
| `THE_MONASTERY_CALDAV_URL`            | CalDAV collection URL used for REPORT and PUT requests |
| `THE_MONASTERY_CALDAV_USERNAME`       | Optional CalDAV basic-auth username                    |
| `THE_MONASTERY_CALDAV_PASSWORD`       | Optional CalDAV basic-auth password                    |
| `THE_MONASTERY_DISCORD_WEBHOOK_URL`   | Discord incoming webhook URL                           |
| `THE_MONASTERY_SLACK_WEBHOOK_URL`     | Slack incoming webhook URL                             |
| `THE_MONASTERY_TELEGRAM_BOT_TOKEN`    | Telegram bot token                                     |
| `THE_MONASTERY_TELEGRAM_CHAT_ID`      | Telegram destination chat ID                           |

Configure integrations through environment variables, then manage provider toggles, templates, tests, and automatic alerts under **Settings > Integrations**.

```sh
export THE_MONASTERY_ICS_SUBSCRIPTION_URLS="https://calendar.example/private.ics"
export THE_MONASTERY_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
docker compose up -d
```

Credentials remain server-side and are not included in profile exports or browser storage. Treat webhook URLs, bot tokens, and CalDAV credentials as secrets.

## Data and Backups

Docker stores application data in the `the-monastery-data` volume mounted at `/data`. Back up that volume, or at minimum the SQLite database, before upgrades or bulk imports.

The UI supports:

- task JSON import and export;
- full profile import and export;
- planning import for tasks, roles, tags, and goals;
- ICS calendar import through a preview step;
- local backup history.

Versioned schemas and safe example payloads live under [`import/`](import/). Personal import files placed there remain ignored unless they match the committed schema or example naming conventions.

## Persistence Model

- Tasks and settings use independent revisions to prevent unrelated writes from invalidating each other.
- Client writes are serialized and include their base revision; stale writes return `409` instead of silently overwriting newer data.
- Pending mutations are retained locally and replayed after connectivity returns.
- IndexedDB and local storage provide a local fallback when the API is unavailable.
- Single-task changes use delta endpoints, while bulk operations fall back to full replacement.

The server remains the canonical state when connectivity is restored.

## Verification

Run the main CI checks locally:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run test:e2e
npm run build:all
npm run dockerfile:lint
npm run docker:smoke -- the-monastery:local
```

Validate Compose configuration independently:

```sh
docker compose config
docker compose -f compose.local.yml config
```

Git hooks run staged formatting and lint fixes before commit, then type checking, unit tests, and Dockerfile linting before push.

CI runs formatting, linting, type checking, unit coverage, Playwright, bundle budgets, npm audit, CodeQL, dependency review on pull requests, Trivy scans, Docker smoke tests, and multi-architecture image builds.

## Deployment Notes

- `docker-compose.yml` uses the remote GHCR image and Watchtower.
- `compose.local.yml` builds from the local Dockerfile and does not auto-update.
- Runtime ports are bound to `127.0.0.1` by default.
- Application logs use the Docker `local` driver with bounded size and file count.
- `/api/health` is available to container health checks and reports runtime health, version, build reference, uptime, and authentication state.
- CI images use a short automatic version such as `v1.0.42`, where `42` is the GitHub Actions run number. Local builds use `v1.0.dev`.
- Watchtower is pinned to the final upstream `1.7.1` multi-architecture digest.
- Watchtower tracks the mutable `latest` tag. Use a `sha-*` image tag when deterministic deployments are more important than automatic updates.

## License

The Monastery is licensed under the [GNU General Public License v3.0](LICENSE).
