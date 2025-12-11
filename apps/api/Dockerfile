# Backend Dockerfile
# Using node:20-slim instead of alpine for better Prisma compatibility
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (workspaces)
RUN npm ci

# Build shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
WORKDIR /app
RUN npm install --legacy-peer-deps
WORKDIR /app/packages/shared
RUN npm run build

# Build backend (using same base for consistency)
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Copy shared package (built)
COPY --from=shared-builder /app/packages/shared ./packages/shared

# Install shared package as dependency and ensure all deps are available
RUN rm -rf ./node_modules/@promptozaurus/shared && \
    mkdir -p ./node_modules/@promptozaurus/shared && \
    cp -r ./packages/shared/dist ./node_modules/@promptozaurus/shared/dist && \
    cp ./packages/shared/package.json ./node_modules/@promptozaurus/shared/package.json.orig && \
    echo '{"name":"@promptozaurus/shared","version":"1.0.0","type":"module","main":"./dist/index.js","types":"./dist/index.d.ts","exports":{".":{"types":"./dist/index.d.ts","default":"./dist/index.js"}}}' > ./node_modules/@promptozaurus/shared/package.json && \
    npm install --legacy-peer-deps

# Copy backend source
COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
# Install dependencies locally to ensure all modules are available
RUN npm install --legacy-peer-deps
# Copy shared package to local node_modules
RUN mkdir -p ./node_modules/@promptozaurus && \
    cp -r ../../node_modules/@promptozaurus/shared ./node_modules/@promptozaurus/shared || \
    (mkdir -p ./node_modules/@promptozaurus/shared && \
     cp -r ../../packages/shared/dist ./node_modules/@promptozaurus/shared/dist && \
     echo '{"name":"@promptozaurus/shared","version":"1.0.0","type":"module","main":"./dist/index.js","types":"./dist/index.d.ts","exports":{".":{"types":"./dist/index.d.ts","default":"./dist/index.js"}}}' > ./node_modules/@promptozaurus/shared/package.json)
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install dependencies for Prisma and system libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./prisma

# Copy Prisma Client from root node_modules (where it was generated)
# Copy .prisma first
RUN mkdir -p ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Install Prisma CLI and @prisma/client to get engines for correct platform (Debian)
# This must be done BEFORE copying shared package to avoid conflicts
# Create npm cache directory for nodejs user to avoid permission issues
RUN mkdir -p /home/nodejs/.npm && \
    chown -R nodejs:nodejs /home/nodejs/.npm && \
    rm -rf ./node_modules/@prisma && \
    npm install prisma@5.8.1 @prisma/client@5.8.1 @prisma/engines@5.8.1 --legacy-peer-deps && \
    npx prisma@5.8.1 generate --schema=./prisma/schema.prisma && \
    chown -R nodejs:nodejs ./node_modules/@prisma ./node_modules/.prisma ./node_modules/@prisma/client && \
    test -d ./node_modules/@prisma/engines && echo "✅ Prisma engines installed" || (ls -la ./node_modules/@prisma/ && echo "❌ Prisma engines NOT found")

# Copy shared package LAST to ensure it's not overwritten by npm install
RUN mkdir -p /tmp/shared-pkg
COPY --from=shared-builder /app/packages/shared/dist /tmp/shared-pkg/dist
RUN mkdir -p ./node_modules/@promptozaurus/shared && \
    cp -r /tmp/shared-pkg/dist ./node_modules/@promptozaurus/shared/dist && \
    echo '{"name":"@promptozaurus/shared","version":"1.0.0","type":"module","main":"./dist/index.js","types":"./dist/index.d.ts","exports":{".":{"types":"./dist/index.d.ts","default":"./dist/index.js"}}}' > ./node_modules/@promptozaurus/shared/package.json && \
    chown -R nodejs:nodejs ./node_modules/@promptozaurus && \
    rm -rf /tmp/shared-pkg && \
    test -d ./node_modules/@promptozaurus/shared && echo "✅ Shared package installed" || echo "❌ Shared package NOT found"

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/index.js"]

