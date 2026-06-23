# TheMonastery

[![CI](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml/badge.svg)](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml)

TheMonastery is a focused planning workspace for deep work. It combines a Kanban board, timeline planning, role and tag goals, analytics, profiles, imports, and a low-clutter Monk Mode in a single self-hosted app.

It is built as a React frontend served by a Fastify API with SQLite persistence. The default Docker deployment is designed for a small personal server and works well behind Cloudflare Tunnel or another reverse proxy.

## Highlights

- Task board with drag-and-drop, filters, recurring tasks, subtasks, notes, activity, and manual time logs.
- Daily timeline with scheduled blocks, drag-to-reschedule, current-time marker, and current-task controls.
- Monk Mode with a simplified focus surface and minimap for lower-clutter execution.
- Role and tag goals with daily, weekly, and monthly target hours.
- Analytics for task status, tracked time, role balance, tag hours, radar view, and activity trends.
- Smart task creation that can infer tags from task names and configured role/tag relationships.
- Theme gallery with Liquid Glass, terminal, dark, and light styles plus simple color customization.
- Profiles, local backup history, JSON import/export, profile import/export, planning import, and ICS import.
- Keyboard-first workflow with command palette and shortcuts.

## Architecture

| Layer       | Technology                                                                |
| ----------- | ------------------------------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI                      |
| Backend     | Node.js 24, Fastify                                                       |
| Storage     | SQLite via better-sqlite3                                                 |
| Charts/UI   | Recharts, Lucide icons, Sonner notifications                              |
| Testing     | Vitest, Testing Library, Playwright                                       |
| CI/Security | GitHub Actions, CodeQL, Dependency Review, Trivy, Hadolint, Docker Buildx |

The frontend and backend are served from the same origin. Browser actions call relative `/api/...` routes, so reverse-proxy and tunnel deployments do not need CORS or a separate API hostname.

## Requirements

- Node.js 24+
- npm 11+
- Docker and Docker Compose for container deployment

## Quick Start

Install dependencies:

```sh
npm install
```

Run the frontend and API in separate terminals:

```sh
npm run dev
npm run dev:api
```

Build and run production locally:

```sh
npm run build:all
npm start
```

## Docker Deployment

The runtime compose file uses the CI-built GHCR image and exposes the app only on localhost:

```text
http://127.0.0.1:8181
```

Start the runtime stack:

```sh
docker compose up -d
```

`docker-compose.yml` uses:

- `ghcr.io/idanbot/the-monastery:latest` by default.
- `127.0.0.1:8181:3000` so the app is not exposed directly on all interfaces.
- A persistent `the-monastery-data` volume mounted at `/data`.
- Watchtower with label-based targeting, so only the app container is auto-updated.

CI updates the `latest` image on the default branch. Watchtower checks every 5 minutes for a newer digest of that tag, pulls it, recreates the labeled app container, and removes old image layers.

Use a pinned CI image when you want a deterministic deploy:

```sh
THE_MONASTERY_IMAGE=ghcr.io/idanbot/the-monastery:sha-<commit> docker compose up -d
```

Pinned `sha-*` tags do not auto-advance. Use `latest` or another moving tag when you want Watchtower-driven runtime updates.

Build from this checkout instead of GHCR:

```sh
docker compose -f compose.local.yml up -d --build
```

`compose.local.yml` builds `the-monastery:local` and intentionally does not include Watchtower, so local development images are not replaced by registry pulls.

If the GHCR package is private or access is restricted:

```sh
docker login ghcr.io
```

Smoke-test a built image:

```sh
npm run docker:smoke -- the-monastery:local
```

## Remote Access

If Cloudflare Tunnel already runs on the host, point the public hostname to:

```text
http://127.0.0.1:8181
```

Recommended production posture:

- Keep the Docker port bound to `127.0.0.1` only.
- Put Cloudflare Access in front of the hostname.
- Use one hostname for both the UI and `/api/*`.

The app does not implement multi-user authentication. Treat Cloudflare Access or another identity-aware proxy as the authentication boundary for remote use.

## Data and Backups

Server data lives in `THE_MONASTERY_DATA_DIR`. In Docker this defaults to `/data`, backed by the `the-monastery-data` volume.

Backup and import paths:

- Local backup history from Settings.
- Task JSON export/import.
- Full profile export/import.
- Planning import for tasks, roles, tags, and goals.
- ICS calendar import.

Manual import schemas and examples live under `import/`. Personal import files in that folder are ignored unless they are schema or example files intended for version control.

## Verification

Run the core checks used by CI:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build:all
npm run dockerfile:lint
```

Useful targeted checks:

```sh
npm run test:e2e -- -g "theme gallery readable"
npm run test:e2e -- -g "drags scheduled"
docker compose config
docker compose -f compose.local.yml config
```

## CI Notes

- Dependency Review runs on pull requests because it compares dependency changes against the base branch.
- Docker Buildx pushes GHCR images only outside pull requests.
- `docker-compose.yml` is the image-based runtime stack with Watchtower.
- `compose.local.yml` is the local-build stack.
- QEMU image caching is disabled to avoid shared-cache reservation races for `tonistiigi/binfmt`.
