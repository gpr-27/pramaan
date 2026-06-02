#!/bin/bash
# Pramaan — Start both backend and frontend

export PATH="$HOME/.local/node/bin:$PATH"
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Read a single value from a .env file (no hardcoded URLs/ports in this script).
read_env() { grep -E "^$1=" "$2" 2>/dev/null | head -n1 | cut -d= -f2-; }

# Single shared .env at the project root (next to backend/ and frontend/).
PORT="$(read_env PORT "$ROOT/.env")"
DEV_PORT="$(read_env VITE_DEV_PORT "$ROOT/.env")"
CLIENT_URL="$(read_env CLIENT_URL "$ROOT/.env")"

# Frontend URL for display hints: prefer the configured CLIENT_URL, fall back to
# the dev port only when CLIENT_URL is empty.
FRONTEND_URL="${CLIENT_URL:-http://localhost:${DEV_PORT}}"

echo ""
echo "  ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗  █████╗ ███╗   ██╗"
echo "  ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║"
echo "  ██████╔╝██████╔╝███████║██╔████╔██║███████║███████║██╔██╗ ██║"
echo "  ██╔═══╝ ██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║██╔══██║██║╚██╗██║"
echo "  ██║     ██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║██║ ╚████║"
echo "  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝"
echo ""
echo "  ET Nucleus — Intelligence-First, Persona-Aware Business News"
echo "  ──────────────────────────────────────────────────────────"
echo ""

# Start backend
echo "  [1/2] Starting backend on port ${PORT}"
cd "$ROOT/backend"
node src/index.js &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "  [2/2] Starting frontend on ${FRONTEND_URL}"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  ✓ Pramaan is running!"
echo "  → Open ${FRONTEND_URL} in your browser"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '  Pramaan stopped.'; exit 0" INT TERM
wait
