# === Stage 1: Builder ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and tsconfig
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY bin ./bin
COPY update-imports.js ./update-imports.js
COPY copy-assets.js ./copy-assets.js

# Build TypeScript
RUN npm run build

# === Stage 2: Production runtime ===
FROM node:20-alpine AS prod

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/bin/www.js"]

# === Stage 3: Development runtime ===
FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src ./src
COPY bin ./bin
COPY update-imports.js ./update-imports.js
COPY copy-assets.js ./copy-assets.js

# Expose port
EXPOSE 3000

ENV NODE_ENV=development

# Run initial TypeScript compilation then watch + nodemon
CMD sh -c "npx tsc && node ./copy-assets.js && node ./update-imports.js && npx nodemon"