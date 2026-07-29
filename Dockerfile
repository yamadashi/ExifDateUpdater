FROM node:22-slim

WORKDIR /app
RUN corepack enable

# Install dependencies first (better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./
COPY src/client/package.json ./src/client/package.json
COPY src/server/package.json ./src/server/package.json
RUN yarn install --immutable

# Build the server workspace only
COPY tsconfig.base.json ./
COPY src/server ./src/server
RUN yarn workspace server build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/server.mjs"]
