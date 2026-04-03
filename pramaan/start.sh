#!/bin/bash
# Pramaan — Start both backend and frontend

export PATH="$HOME/.local/node/bin:$PATH"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗  █████╗ ███╗   ██╗"
echo "  ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║"
echo "  ██████╔╝██████╔╝███████║██╔████╔██║███████║███████║██╔██╗ ██║"
echo "  ██╔═══╝ ██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║██╔══██║██║╚██╗██║"
echo "  ██║     ██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║██║ ╚████║"
echo "  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝"
echo ""
echo "  Responsible GenAI Workflow for Verified Civic Journalism"
echo "  ──────────────────────────────────────────────────────────"
echo ""

# Start backend
echo "  [1/2] Starting backend on http://localhost:3001"
cd "$ROOT/backend"
node src/index.js &
BACKEND_PID=$!

sleep 2

# Start frontend  
echo "  [2/2] Starting frontend on http://localhost:5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  ✓ Pramaan is running!"
echo "  → Open http://localhost:5173 in your browser"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '  Pramaan stopped.'; exit 0" INT TERM
wait
