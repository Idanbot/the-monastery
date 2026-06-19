# TheMonastery

[![CI](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml/badge.svg)](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml)

TheMonastery is a focused task board for planning deep work, tracking role/tag balance, and keeping daily execution low-clutter. It runs as a React app with a Fastify/SQLite backend, with local-first behavior and Docker support for simple deployment.

## What It Does

- Kanban task flow with drag-and-drop, filters, recurring tasks, subtasks, activity, and manual time logs.
- Daily timeline with draggable scheduled blocks, current-time marker, and task pin controls.
- Monk mode for a reduced interface with minimap and focus-first controls.
- Analytics for task status, role hours, tag hours, radar charts, and weekly balance.
- Role and tag goals with daily, weekly, and monthly target hours.
- Theme gallery with Liquid Glass, terminal, dark, and light themes plus simple color overrides.
- Local backup history, JSON import/export, profile export/import, and ICS import.
- Keyboard-first workflow with command palette and shortcuts.

## Stack

- Frontend: React 19, TypeScript, Tailwind CSS 4, Vite, Radix UI, Recharts, Three.js.
- Backend: Node.js 24, Fastify, SQLite through better-sqlite3.
- Testing: Vitest, Testing Library, Playwright.
- CI: GitHub Actions with format, lint, typecheck, unit coverage, e2e, CodeQL, Dependency Review, Trivy, Hadolint, and Docker Buildx.

## Requirements

- Node.js 24+
- npm 11+
- Docker and Docker Compose for container runs

## Development

Install dependencies:

```sh
npm install
```

Run frontend and API in separate terminals:

```sh
npm run dev
npm run dev:api
```

Build production assets:

```sh
npm run build:all
npm start
```

## Docker

Default Compose uses the CI-built image from GHCR via `docker-compose.yml`.

```sh
docker compose up -d
```

Override the published image when testing a specific CI tag:

```sh
THE_MONASTERY_IMAGE=ghcr.io/idanbot/the-monastery:sha-<commit> docker compose up -d
```

Build from this checkout with the local Compose file:

```sh
docker compose -f compose.local.yml up -d --build
```

That builds and tags the image as `the-monastery:local`.

If GHCR is private or the package has not been made public yet:

```sh
docker login ghcr.io
```

Smoke-test a built image:

```sh
npm run docker:smoke -- the-monastery:local
```

## Verification

Run the same core checks used by CI:

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

- Dependency Review runs only on pull requests because it compares dependency changes against the base branch.
- Docker Buildx pushes GHCR images only outside pull requests.
- `docker-compose.yml` is the image-based runtime file. `compose.local.yml` is local-build only.
- QEMU image caching is disabled in CI to avoid shared-cache reservation races for `tonistiigi/binfmt`.

## Data

The app stores server data under `THE_MONASTERY_DATA_DIR`, defaulting to `/data` in Docker. Compose mounts this as the `the-monastery-data` volume.

Backups are available from settings and include local backup history plus JSON export/import flows.
