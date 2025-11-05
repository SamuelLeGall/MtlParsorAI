#!/bin/bash
set -e

# Move to deploy folder
cd "$(dirname "$0")"

# Default values
ENVIRONMENT=${1:-local}   # default to 'local' if no argument
CONTAINER_NAME=""   # must match the container_name in docker-compose
COMPOSE_FILE=""

# Determine compose file and container name based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="production/docker-compose.yml"
    CONTAINER_NAME="mtlparsorai-prod"  # if change -> update docker-compose
    echo "⚡ Launching production environment..."
else
    COMPOSE_FILE="local/docker-compose.yml"
    CONTAINER_NAME="mtlparsorai-local" # if change -> update docker-compose
    echo "⚡ Launching local development environment..."
fi


# Stop & remove existing container if it exists
EXISTING_CONTAINER=$(docker ps -aq -f name=$CONTAINER_NAME)
if [ $EXISTING_CONTAINER ]; then
    echo "Stopping and removing existing container: $CONTAINER_NAME"
    docker rm -f $CONTAINER_NAME
fi

# Build and start the container
docker compose -f "$COMPOSE_FILE" up --build -d

# Show final message
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "✅ Prod container started at http://localhost:3000"
else
    echo "✅ Local dev container started at http://localhost:3000"
fi