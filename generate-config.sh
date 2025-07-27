#!/bin/bash
# generate-config.sh: Generate config.js from .env

ENV_FILE=".env"
CONFIG_FILE="docs/config.js"

# Read .env and export variables
set -a
source "$ENV_FILE"
set +a

cat > "$CONFIG_FILE" <<EOF
// config.js
// Google API credentials for Nutrition Coaching App
window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: '${GOOGLE_CLIENT_ID}',
  GOOGLE_API_KEY: '${GOOGLE_API_KEY}'
};
EOF

echo "Generated $CONFIG_FILE from $ENV_FILE"
