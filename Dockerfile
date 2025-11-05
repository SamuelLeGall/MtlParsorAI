FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json tsconfig.json openaiSecret.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY ./src ./src
COPY ./bin ./bin

# Expose port
EXPOSE 3000

ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]