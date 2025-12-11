# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy workspace package files
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (workspaces)
RUN npm install --legacy-peer-deps

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

# Build frontend
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

# Copy frontend source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Install dependencies locally to ensure all modules are available
RUN npm install --legacy-peer-deps

# Build application
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production image with Nginx
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

