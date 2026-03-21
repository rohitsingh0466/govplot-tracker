#!/usr/bin/env bash
# ============================================================
# GovPlot Tracker — Local Development Setup
# Run: bash dev_setup.sh
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     GovPlot Tracker — Local Dev Setup           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Python setup ─────────────────────────────────────────
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "   ✅ Python dependencies installed"

# ── Environment file ─────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ✅ .env created from .env.example (edit it with your keys)"
else
  echo "   ℹ️  .env already exists"
fi

# ── Create data directory ─────────────────────────────────
mkdir -p data/schemes
echo "[]" > data/schemes/latest.json

# ── Run initial scrape ────────────────────────────────────
echo ""
echo "🕷️  Running initial scrape (uses fallback data if sites unreachable)..."
python -m scraper.main
echo "   ✅ Scrape complete — data/schemes/latest.json updated"

# ── Start backend ────────────────────────────────────────
echo ""
echo "⚡ Starting FastAPI backend on http://localhost:8000 ..."
echo "   API docs at: http://localhost:8000/api/docs"
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 2

# ── Frontend setup ────────────────────────────────────────
echo ""
echo "💻 Setting up Next.js frontend..."
cd frontend
npm install -q
echo "   ✅ Node dependencies installed"
echo ""
echo "🌐 Starting frontend on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!
cd ..

# ── Done ─────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ GovPlot Tracker Running!                    ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000               ║"
echo "║  API:       http://localhost:8000               ║"
echo "║  API Docs:  http://localhost:8000/api/docs      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Press Ctrl+C to stop both servers"

# Keep running
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Servers stopped.'" INT
wait
