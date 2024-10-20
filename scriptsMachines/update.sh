#!/bin/bash

# executed on the vps machine
cd /var/www/mtlParsorAI

# Pull the latest changes
git pull origin main

# Install new dependencies (if needed)
npm install

# Run the build
npm run build

# Move the secret file to the final destination
mv /tmp/openaiSecret.json /var/www/mtlParsorAI/build/dist/openaiSecret.json

# Restart PM2 process
pm2 restart mtlParsorAI
