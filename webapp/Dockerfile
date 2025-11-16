FROM node:20-alpine AS BUILD_IMAGE

ARG VITE_SERVER_INTERNAL
ARG VITE_BRANDING

# Install dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application from build stage
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/build ./build
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE --chown=nodejs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "./build"]