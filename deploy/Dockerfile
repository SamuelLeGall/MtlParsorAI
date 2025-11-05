FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json tsconfig.json openaiSecret.json ./

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
COPY package*.json tsconfig.json openaiSecret.json ./
RUN npm ci --only=production

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/bin/www.js"]