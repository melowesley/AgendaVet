#!/bin/bash
# Build script that ensures environment variables are loaded

set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Load from .env.production if it exists (overrides .env)
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Run the build
vite build
