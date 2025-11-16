FROM node:20-bookworm-slim

# Create app directory
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install prisma CLI globally
RUN npm install -g prisma@latest --omit=dev

# Copy schema and migration folder
COPY ./ ./prisma/

# Create non-root user and database directory with specific UID/GID
# Using same UID/GID as backend container's nodejs user for permission compatibility
RUN groupadd -r nodejs -g 1001 && useradd -r -g nodejs -u 1001 nodejs && \
    mkdir -p /database && \
    chown -R nodejs:nodejs /app /database

# Switch to non-root user
USER nodejs

CMD ["prisma", "migrate", "deploy"]