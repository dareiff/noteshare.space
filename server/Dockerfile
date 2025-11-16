FROM node:20-bookworm-slim AS BUILD_IMAGE

# Install dependencies
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create non-root user with specific UID/GID to match migration container
RUN groupadd -r nodejs -g 1001 && useradd -r -g nodejs -u 1001 nodejs

# Copy built application from build stage
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/build ./build
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nodejs

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "./build/src/server.js"]
