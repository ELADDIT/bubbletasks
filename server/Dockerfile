# syntax=docker/dockerfile:1

FROM node:20-slim

WORKDIR /app

# Install sqlite3 CLI used by the application
RUN apt-get update \
    && apt-get install -y --no-install-recommends sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
