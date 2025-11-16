FROM node:20-bookworm-slim

# Create app directory
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install prisma CLI globally
RUN npm install -g prisma@latest --omit=dev

# Copy schema and migration folder
COPY ./ ./prisma/

# Create non-root user
RUN groupadd -r prisma && useradd -r -g prisma prisma && \
    chown -R prisma:prisma /app

# Switch to non-root user
USER prisma

CMD ["prisma", "migrate", "deploy"]