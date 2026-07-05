FROM node:24-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
ARG THE_MONASTERY_BUILD_REF=local
ARG THE_MONASTERY_BUILD_DATE=unknown
ARG THE_MONASTERY_BUILD_NUMBER=dev
ENV THE_MONASTERY_BUILD_REF=$THE_MONASTERY_BUILD_REF
ENV THE_MONASTERY_BUILD_DATE=$THE_MONASTERY_BUILD_DATE
ENV THE_MONASTERY_BUILD_NUMBER=$THE_MONASTERY_BUILD_NUMBER
COPY . .
RUN npm run build:all

FROM node:24-slim AS prod-deps
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-slim AS runtime
ARG THE_MONASTERY_BUILD_REF=local
ARG THE_MONASTERY_BUILD_DATE=unknown
ARG THE_MONASTERY_BUILD_NUMBER=dev
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV THE_MONASTERY_DATA_DIR=/data
ENV THE_MONASTERY_BUILD_REF=$THE_MONASTERY_BUILD_REF
ENV THE_MONASTERY_BUILD_DATE=$THE_MONASTERY_BUILD_DATE
ENV THE_MONASTERY_BUILD_NUMBER=$THE_MONASTERY_BUILD_NUMBER
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
CMD ["node", "server-dist/server/index.js"]
