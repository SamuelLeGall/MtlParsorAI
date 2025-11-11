# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files & tsconfig
COPY package*.json tsconfig.json ./

# Install dev dependencies
RUN npm ci

# Copy source code
COPY ../src ./src
COPY ../bin ./bin
COPY ./deploy/build-utils ./deploy/build-utils

# Build TypeScript & run post-build scripts
RUN npm run build

FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY ../src ./src
COPY ../bin ./bin

# Expose port
EXPOSE 3000

ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]


FROM node:20-alpine AS prod

WORKDIR /app

# Copy package.json & install only prod deps
COPY package*.json tsconfig.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled JS from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/bin/www.js"]