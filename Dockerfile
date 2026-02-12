# ========================================
# Optimized Multi-Stage Dockerfile
# Node.js TypeScript Application
# ========================================

ARG NODE_VERSION=24.11.1-alpine
FROM node:${NODE_VERSION} AS base
WORKDIR /app

FROM base AS deps

COPY package*.json ./
# stopgap while issue gets fixed: https://github.com/npm/cli/issues/8726; eventually replace with npm ci
RUN npm i

FROM deps AS build
COPY . . 
RUN npm run build

FROM build AS security
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

FROM build AS start
CMD ["npm", "run", "start"]




