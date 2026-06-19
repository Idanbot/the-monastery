# TheMonastery

[![CI](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml/badge.svg)](https://github.com/idanbot/the-monastery/actions/workflows/ci.yml)

A minimal focus tracker for managing task flow, schedules, and work sessions. Built for performance, privacy, and simplicity.

## 🚀 Features

- **Task Management**: Seamless drag-and-drop workflow.
- **Focus Sessions**: Built-in timer to track deep work.
- **Privacy-First**: Local storage and fast data querying using SQLite.
- **Modern Stack**: React 19, Fastify, Tailwind CSS 4, and Vite.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Radix UI
- **Backend**: Node.js, Fastify, `better-sqlite3`
- **Testing**: Vitest (Unit/Coverage), Playwright (E2E)

## 💻 Development

Start the development server (frontend & backend):

```sh
npm install
npm run dev
# In a separate terminal for the API:
npm run dev:api
```

## 🐳 Docker

Run the application quickly using the pre-built Docker image from the GitHub Container Registry:

```sh
docker compose up -d
```
*(No login required! The package is publicly available).*

### Building Locally

If you want to build the Docker image locally from the source code:

```sh
docker compose -f docker-compose.local.yml up -d --build
```

You can verify your local image using the provided smoke test:
```sh
npm run docker:smoke -- the-monastery
```

## 🧪 Verification & Testing

The project is thoroughly tested and verified. These commands are also run automatically in the CI pipeline:

```sh
npm run format:check    # Check formatting (Prettier)
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript type-checking
npm test                # Run Vitest unit tests
npm run test:e2e        # Run Playwright E2E tests
npm run build:all       # Build frontend and backend
npm run dockerfile:lint # Lint the Dockerfile using Hadolint
```
