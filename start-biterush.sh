#!/usr/bin/env bash
# BiteRush one-click launcher (Linux desktop)
# Frees ports / leftover processes, starts Docker MongoDB, backend, and frontend.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

RUN_DIR="$ROOT/.run"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"
DOCKER_LOG="$RUN_DIR/docker.log"
PID_FILE="$RUN_DIR/biterush.pids"

BACKEND_PORT="${BITERUSH_BACKEND_PORT:-3000}"
FRONTEND_PORT="${BITERUSH_FRONTEND_PORT:-5173}"
MONGO_PORT="${BITERUSH_MONGO_PORT:-27017}"
API_URL="http://127.0.0.1:${BACKEND_PORT}/api/v1"
WEB_URL="http://127.0.0.1:${FRONTEND_PORT}"

mkdir -p "$RUN_DIR"

green()  { printf '\033[1;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }
red()    { printf '\033[1;31m%s\033[0m\n' "$*"; }
info()   { printf '\033[1;36m%s\033[0m\n' "$*"; }

pause_before_exit() {
  echo
  yellow "Press Enter to close this window…"
  if [[ -t 0 ]] || [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]; then
    read -r _ || true
  fi
}

die() {
  echo
  red "ERROR: $*"
  pause_before_exit
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

pids_on_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
    return 0
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser "${port}/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true
    return 0
  fi
  ss -lntp 2>/dev/null | awk -v p=":${port}" '$4 ~ p"$" {print $NF}' \
    | grep -oE 'pid=[0-9]+' | cut -d= -f2 || true
}

kill_pids() {
  local pids="$*"
  [[ -n "${pids// /}" ]] || return 0
  # shellcheck disable=SC2086
  kill $pids >/dev/null 2>&1 || true
  sleep 0.4
  # shellcheck disable=SC2086
  kill -9 $pids >/dev/null 2>&1 || true
}

free_port() {
  local port="$1"
  local pids
  pids="$(pids_on_port "$port" | tr '\n' ' ')"
  if [[ -n "${pids// /}" ]]; then
    yellow "  Port ${port} busy (PIDs: ${pids}) — freeing…"
    kill_pids $pids
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
    sleep 0.3
  fi
}

stop_tracked() {
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      [[ -n "${pid:-}" ]] || continue
      kill "$pid" >/dev/null 2>&1 || true
      pkill -P "$pid" >/dev/null 2>&1 || true
    done < "$PID_FILE" || true
    rm -f "$PID_FILE"
  fi
}

free_resources() {
  info "Freeing leftover BiteRush processes and ports…"
  stop_tracked

  # Stop previous Nest / Vite from this project only
  pkill -f "$BACKEND_DIR/.*nest start" >/dev/null 2>&1 || true
  pkill -f "$FRONTEND_DIR/.*vite" >/dev/null 2>&1 || true
  pkill -f "nest start --watch" >/dev/null 2>&1 || true

  free_port "$BACKEND_PORT"
  free_port "$FRONTEND_PORT"
  green "Ports ${BACKEND_PORT} and ${FRONTEND_PORT} are free"
}

elevate() {
  if command -v pkexec >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]; then
    pkexec "$@"
    return $?
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return $?
  fi
  "$@"
}

docker_ok() {
  docker info >/dev/null 2>&1
}

ensure_docker() {
  require_cmd docker
  if docker_ok; then
    green "Docker daemon is running"
    return 0
  fi
  info "Starting Docker (password prompt may appear)…"
  elevate systemctl start docker >/dev/null 2>&1 || true
  sleep 2
  docker_ok || die "Could not start Docker. Enable it with: sudo systemctl enable --now docker"
  green "Docker daemon is running"
}

compose_up() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$ROOT/docker-compose.yml" up -d "$@"
    return $?
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$ROOT/docker-compose.yml" up -d "$@"
    return $?
  fi
  return 127
}

wait_tcp() {
  local host="$1" port="$2" tries="${3:-40}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if command -v nc >/dev/null 2>&1; then
      nc -z "$host" "$port" >/dev/null 2>&1 && return 0
    elif timeout 1 bash -c "echo >/dev/tcp/${host}/${port}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ensure_mongo() {
  info "Starting MongoDB container…"
  : >"$DOCKER_LOG"
  if ! compose_up mongodb >>"$DOCKER_LOG" 2>&1; then
    yellow "Docker compose failed without sudo — retrying…"
    if docker compose version >/dev/null 2>&1; then
      elevate docker compose -f "$ROOT/docker-compose.yml" up -d mongodb >>"$DOCKER_LOG" 2>&1 \
        || die "Failed to start MongoDB container. See $DOCKER_LOG"
    else
      elevate docker-compose -f "$ROOT/docker-compose.yml" up -d mongodb >>"$DOCKER_LOG" 2>&1 \
        || die "Failed to start MongoDB container. See $DOCKER_LOG"
    fi
  fi

  if wait_tcp 127.0.0.1 "$MONGO_PORT" 45; then
    green "MongoDB ready on 127.0.0.1:${MONGO_PORT}"
  else
    red "Docker log:"
    cat "$DOCKER_LOG" || true
    die "MongoDB did not become ready on port ${MONGO_PORT}"
  fi
}

ensure_env() {
  if [[ ! -f "$BACKEND_DIR/.env" ]]; then
    cat >"$BACKEND_DIR/.env" <<EOF
PORT=${BACKEND_PORT}
MONGODB_URI=mongodb://admin:password@localhost:${MONGO_PORT}/biterush?authSource=admin
FRONTEND_ORIGIN=http://localhost:${FRONTEND_PORT}
EOF
    yellow "Created backend/.env"
  fi
}

ensure_deps() {
  if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
    info "Installing backend dependencies (first run)…"
    (cd "$BACKEND_DIR" && npm install) || die "Backend npm install failed"
  fi
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    info "Installing frontend dependencies (first run)…"
    (cd "$FRONTEND_DIR" && npm install) || die "Frontend npm install failed"
  fi
}

wait_http() {
  local url="$1" tries="${2:-90}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$WEB_URL" >/dev/null 2>&1 || true
  elif command -v sensible-browser >/dev/null 2>&1; then
    sensible-browser "$WEB_URL" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  yellow $'\nStopping BiteRush…'
  stop_tracked || true
  free_port "$BACKEND_PORT" || true
  free_port "$FRONTEND_PORT" || true
  green "Stopped backend + frontend. MongoDB container is still running."
  yellow "Close this window when you are done."
}

main() {
  clear 2>/dev/null || true
  green "════════════════════════════════════════"
  green "  BiteRush — one-click start"
  green "════════════════════════════════════════"
  echo
  info "Project: $ROOT"
  echo

  require_cmd node
  require_cmd npm
  require_cmd curl
  green "Node $(node -v) OK"

  free_resources
  ensure_env
  ensure_docker
  ensure_mongo
  ensure_deps

  trap cleanup EXIT INT TERM

  info "Starting backend on :${BACKEND_PORT} …"
  : >"$BACKEND_LOG"
  (
    cd "$BACKEND_DIR"
    npm run start:dev
  ) >>"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" >>"$PID_FILE"

  yellow "Waiting for API ${API_URL} …"
  if ! wait_http "$API_URL" 90; then
    red "Backend failed. Last log lines:"
    tail -n 60 "$BACKEND_LOG" || true
    die "Backend did not start"
  fi
  green "API ready → ${API_URL}"

  info "Starting frontend on :${FRONTEND_PORT} …"
  : >"$FRONTEND_LOG"
  (
    cd "$FRONTEND_DIR"
    npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
  ) >>"$FRONTEND_LOG" 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" >>"$PID_FILE"

  yellow "Waiting for UI ${WEB_URL} …"
  if ! wait_http "$WEB_URL" 60; then
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      red "Frontend log:"
      tail -n 60 "$FRONTEND_LOG" || true
      die "Frontend did not start"
    fi
    yellow "Frontend is starting (page may take a few extra seconds)…"
  fi
  green "UI ready → ${WEB_URL}"

  echo
  green "════════════════════════════════════════"
  green "  BiteRush is running"
  green "════════════════════════════════════════"
  echo
  echo "  App:       ${WEB_URL}"
  echo "  Menu:      ${WEB_URL}/menu"
  echo "  API:       ${API_URL}"
  echo "  MongoDB:   127.0.0.1:${MONGO_PORT} (Docker)"
  echo
  echo "  Logs: ${BACKEND_LOG}"
  echo "        ${FRONTEND_LOG}"
  echo
  yellow "Press Ctrl+C in this window to stop backend + frontend."
  echo

  open_browser
  tail -n 20 -F "$BACKEND_LOG" "$FRONTEND_LOG"
}

if ! main "$@"; then
  die "Launcher exited unexpectedly. Scroll up for details."
fi
