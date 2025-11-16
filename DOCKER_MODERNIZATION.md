# Docker Modernization Changes

This document outlines the modernization changes made to the Docker setup.

## Changes Made

### 1. docker-compose.yml
- **Removed** outdated `version: "3.7"` specification (modern Docker Compose doesn't require it)

### 2. All Dockerfiles - Node.js Upgrade
- **Upgraded** from Node 18 to Node 20 LTS
- Node 18 is approaching EOL, while Node 20 is the current LTS version

### 3. server/Dockerfile
- **Changed** base image from `node:18-bookworm` to `node:20-bookworm-slim` (smaller image size)
- **Added** non-root user (`nodejs`) for better security
- **Improved** layer caching by separating package installation from source copy
- **Added** `--prefer-offline --no-audit` flags to npm ci for faster builds
- **Enabled** `npm prune --production` to reduce final image size
- **Cleaned up** apt cache with `rm -rf /var/lib/apt/lists/*` to reduce image size
- **Set** proper file ownership for non-root user
- **Added** explicit `NODE_ENV=production` environment variable

### 4. webapp/Dockerfile
- **Changed** base image from `node:18-alpine` to `node:20-alpine`
- **Removed** `--force` flag from npm ci (was causing unnecessary issues)
- **Added** `--prefer-offline --no-audit` flags for faster builds
- **Added** non-root user (`nodejs`) for better security
- **Enabled** `npm prune --production` to reduce final image size
- **Fixed** ARG declarations (removed incorrect space in syntax)
- **Added** explicit `NODE_ENV=production` environment variable
- **Set** proper file ownership for non-root user

### 5. server/prisma/Dockerfile
- **Changed** base image from `node:18-bookworm` to `node:20-bookworm-slim`
- **Cleaned up** commented-out old code
- **Removed** unnecessary `echo $DATABASE_URL` debug statement
- **Added** non-root user (`prisma`) for better security
- **Improved** apt-get usage with cache cleanup
- **Updated** to use latest Prisma version with `prisma@latest`
- **Added** `--omit=dev` flag to npm install for smaller image
- **Set** proper file ownership for non-root user

## Security Improvements
All containers now run as non-root users:
- `server`: runs as `nodejs` user
- `webapp`: runs as `nodejs` user (UID 1001, GID 1001)
- `migrate`: runs as `prisma` user

## Performance Improvements
- Smaller base images (`-slim` variants where appropriate)
- Better layer caching
- Removed development dependencies in production images
- Cleaned apt cache to reduce image size
- Added `--prefer-offline` to speed up npm installs

## Testing Instructions

### Build all services:
```bash
docker compose build
```

### Build specific service:
```bash
docker compose build backend
docker compose build frontend
docker compose build migrate
```

### Run the full stack:
```bash
docker compose up
```

### Run with rebuild:
```bash
docker compose up --build
```

### Run in detached mode:
```bash
docker compose up -d
```

### View logs:
```bash
docker compose logs -f
```

### Stop all services:
```bash
docker compose down
```

### Stop and remove volumes:
```bash
docker compose down -v
```

## Verification Checklist
- [ ] All images build successfully
- [ ] Migration service completes successfully
- [ ] Backend service starts and listens on port 8080
- [ ] Frontend service starts and listens on port 3000
- [ ] Services can communicate with each other
- [ ] Database persists correctly in the sqlite volume
- [ ] Environment variables are properly passed
- [ ] Non-root users have correct permissions
- [ ] Application functions as expected

## Troubleshooting

### Permission Issues
If you encounter permission issues with the database volume:
```bash
docker compose down -v
docker compose up
```

### Build Cache Issues
If you need to rebuild from scratch:
```bash
docker compose build --no-cache
```

### Check running containers:
```bash
docker compose ps
```

### Inspect a specific service:
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs migrate
```
