#!/usr/bin/env bash
# ============================================================
# GovPlot Tracker — GitHub Push Script
# Usage: bash push_to_github.sh YOUR_GITHUB_USERNAME
# ============================================================
set -e

USERNAME=${1:-"YOUR_GITHUB_USERNAME"}
REPO="govplot-tracker"
REPO_URL="https://github.com/${USERNAME}/${REPO}.git"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        GovPlot Tracker — GitHub Setup           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Check git ─────────────────────────────────────────
if ! command -v git &>/dev/null; then
  echo "❌ git not found. Install git first."
  exit 1
fi

echo "📦 Step 1: Preparing local repo..."
git init -b main 2>/dev/null || git checkout -b main 2>/dev/null || true
git add .
git commit -m "🚀 Initial commit: GovPlot Tracker v1.0 — 9 cities, FastAPI + Next.js" \
  --allow-empty 2>/dev/null || true

# ── 2. Create GitHub repo via API ────────────────────────
echo ""
echo "🐙 Step 2: Creating GitHub repository '${REPO}'..."
echo "   → You'll need a GitHub Personal Access Token (PAT)"
echo "   → Get one at: https://github.com/settings/tokens/new"
echo "      (check 'repo' scope)"
echo ""
read -rsp "   Paste your GitHub PAT (hidden): " GH_TOKEN
echo ""

CREATE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"${REPO}\",\"description\":\"India Govt Plot Scheme Tracker — 9 cities, real-time alerts\",\"private\":false}")

if [ "$CREATE_RESP" = "201" ]; then
  echo "   ✅ Repository created: https://github.com/${USERNAME}/${REPO}"
elif [ "$CREATE_RESP" = "422" ]; then
  echo "   ℹ️  Repository already exists — continuing with push..."
else
  echo "   ⚠️  Unexpected response: $CREATE_RESP — proceeding anyway..."
fi

# ── 3. Push code ─────────────────────────────────────────
echo ""
echo "🚀 Step 3: Pushing code to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_TOKEN}@github.com/${USERNAME}/${REPO}.git"
git push -u origin main --force

echo ""
echo "✅ Code pushed to: https://github.com/${USERNAME}/${REPO}"

# ── 4. Set GitHub Secrets reminder ───────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        Next: Add GitHub Secrets                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Go to: https://github.com/${USERNAME}/${REPO}/settings/secrets/actions"
echo "  Add these secrets:"
echo ""
echo "  Secret Name          Value"
echo "  ─────────────────    ──────────────────────────"
echo "  SUPABASE_URL         https://xxx.supabase.co"
echo "  SUPABASE_KEY         your_supabase_anon_key"
echo "  SENDGRID_API_KEY     SG.xxxxxxxxxxxx"
echo "  TELEGRAM_BOT_TOKEN   1234567890:AAxxxxxxxx"
echo ""

# ── 5. Deploy instructions ───────────────────────────────
echo "╔══════════════════════════════════════════════════╗"
echo "║        Deploy in 2 Clicks (Free)                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  FRONTEND (Vercel):"
echo "  → https://vercel.com/new"
echo "  → Import: github.com/${USERNAME}/${REPO}"
echo "  → Root Directory: frontend"
echo "  → Add env: NEXT_PUBLIC_API_URL=https://your-backend.railway.app"
echo ""
echo "  BACKEND (Railway):"
echo "  → https://railway.app/new"
echo "  → Deploy from GitHub: ${REPO}"
echo "  → Start command: uvicorn backend.main:app --host 0.0.0.0 --port \$PORT"
echo "  → Add all .env vars in Railway dashboard"
echo ""
echo "🎉 Done! Your GovPlot Tracker is live."
