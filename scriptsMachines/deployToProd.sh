#!/bin/bash

# executed on local machine

# Define variables
VPS_USER="root"  # Your VPS username
VPS_IP="92.113.25.237"      # Your VPS IP address
TEMP_PATH="/tmp/openaiSecret.json"  # Temporary path on the VPS
REMOTE_PROJECT_PATH="/var/www/mtlParsorAI/build/dist/"  # Final path to your project on the VPS
LOCAL_SECRET_FILE="D:\workspace\jsprojects\node\MtlParsorAI\openaiSecret.json"  # Local path to your secret file

# SCP the secret file to a temporary location on the VPS
scp $LOCAL_SECRET_FILE $VPS_USER@$VPS_IP:$TEMP_PATH

# SSH into the VPS and run the update script
ssh $VPS_USER@$VPS_IP 'bash /var/www/mtlParsorAI/scriptsMachines/update.sh'
