#!/bin/sh
set -eu

cd /app/apps/agent
exec pnpm exec langgraphjs dev --host 0.0.0.0 --port "${PORT:-3600}" --no-browser --no-reload --config langgraph.json
