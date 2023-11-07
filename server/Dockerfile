FROM node:18-bookworm AS BUILD_IMAGE

# install dependencies
WORKDIR /app
RUN apt update && apt install -y openssl
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . .

RUN npx prisma generate

RUN npm run build

# remove development dependencies
RUN npm prune --production

FROM node:18-bookworm

WORKDIR /app
COPY --from=0 /app .

ENV PORT 8080
EXPOSE 8080

CMD ["node", "./build/src/server.js"]