# syntax=docker/dockerfile:1

##############################################
# Build the frontend assets
##############################################
FROM node:20-slim AS client-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

##############################################
# Install server production dependencies
##############################################
FROM node:20-slim AS server-build
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

##############################################
# Runtime image
##############################################
FROM node:20-slim AS runtime
WORKDIR /app

# Install sqlite CLI used by the application
RUN apt-get update \
  && apt-get install -y --no-install-recommends sqlite3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=server-build /app/ ./
COPY --from=client-build /app/client/dist ./client-dist

ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "server.js"]
