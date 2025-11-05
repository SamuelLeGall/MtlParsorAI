#!/bin/bash
set -e

# Move to deploy folder
cd "$(dirname "$0")"


CONTAINER_NAME="mtlparsorai-app"   # must match the container_name in docker-compose

# Stop & remove existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping and removing existing container: $CONTAINER_NAME"
    docker rm -f $CONTAINER_NAME
fi

echo "Starting local development environment..."
docker compose -f local/docker-compose.yml up --build -d

echo "✅ Local dev container started!"
echo "Open http://localhost:3000 in your browser"