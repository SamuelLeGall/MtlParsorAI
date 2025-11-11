#!/bin/bash

# executed on the vps machine
cd /var/www/mtlParsorAI

# Pull the latest changes
git pull origin main

# Install new dependencies (if needed)
npm install

# Run the build
npm run build

# Restart PM2 process
pm2 restart MtlParsorAI