# TheMonastery

A minimal focus tracker for managing task flow, schedules, and work sessions.

## Development

```sh
npm install
npm run dev
```

## Verification

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build:all
npm run dockerfile:lint
```

## Docker

```sh
docker build -t the-monastery .
docker run --rm -p 3000:3000 -v the-monastery-data:/data the-monastery
npm run docker:smoke -- the-monastery
```
