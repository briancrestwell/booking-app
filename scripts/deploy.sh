#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Zero-downtime production deployment script
#
# Strategy:
#   1. Pull the new images from the registry.
#   2. Scale up new containers alongside the old ones (rolling update).
#   3. Wait for health-checks to pass.
#   4. Remove the old containers.
#
# Expected env vars (set in .env.prod or injected by CI/CD):
#   REGISTRY, IMAGE_PREFIX, IMAGE_TAG
#   COMPOSE_PROJECT_NAME
#
# Usage on VPS:
#   export IMAGE_TAG=abc1234
#   ./scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
MAX_WAIT=120      # seconds to wait for each healthcheck
POLL_INTERVAL=5

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { echo "[ERROR] $*" >&2; exit 1; }

check_env() {
  for var in REGISTRY IMAGE_PREFIX IMAGE_TAG POSTGRES_USER POSTGRES_PASSWORD \
             POSTGRES_DB REDIS_PASSWORD JWT_SECRET CORS_ORIGIN \
             NEXT_PUBLIC_WS_URL NEXT_PUBLIC_API_URL; do
    [[ -z "${!var:-}" ]] && fail "Required env var '$var' is not set."
  done
}

wait_healthy() {
  local service="$1"
  local elapsed=0
  log "Waiting for '$service' to become healthy..."
  while true; do
    status=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
               ps --format json "$service" 2>/dev/null \
               | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d[0].get('Health','') if isinstance(d,list) else d.get('Health',''))" 2>/dev/null || echo "unknown")
    if [[ "$status" == "healthy" ]]; then
      log "'$service' is healthy."
      return 0
    fi
    if (( elapsed >= MAX_WAIT )); then
      fail "'$service' did not become healthy within ${MAX_WAIT}s. Status: $status"
    fi
    sleep "$POLL_INTERVAL"
    (( elapsed += POLL_INTERVAL ))
  done
}

# ── Main ─────────────────────────────────────────────────────────────────────
log "=== Starting deployment (tag: ${IMAGE_TAG:-latest}) ==="

check_env

log "Pulling latest images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

log "Bringing up postgres and redis first (idempotent)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

wait_healthy postgres
wait_healthy redis

log "Deploying API..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --build api

wait_healthy api

log "Deploying web..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --build web

wait_healthy web

log "Reloading nginx (if already running, otherwise start it)..."
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps nginx | grep -q "Up"; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec nginx nginx -s reload
else
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx
fi

log "Pruning dangling images to reclaim disk space..."
docker image prune -f

log "=== Deployment complete! ==="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
