# prism-frontend
FROM node:24 AS base
WORKDIR /usr/src/app

FROM base AS deps
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install project dependencies
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    npm install

FROM deps AS project

COPY . .

FROM project AS build

# Build the project
RUN npm run build

FROM build AS prod

# Expose the desired port (if needed, e.g., 3000)
EXPOSE 3000

ENV NODE_ENV=production
# Command to run the application
CMD ["node", "./dist/server/entry.mjs"]
