#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step()  { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }

# ── Prerequisites ───────────────────────────────────────────────────────────
step "Checking prerequisites"

command -v docker >/dev/null 2>&1 || { error "Docker is required. Install it from https://docs.docker.com/engine/install/"; exit 1; }
command -v node   >/dev/null 2>&1 || { error "Node.js is required. Install it from https://nodejs.org/"; exit 1; }
command -v npm    >/dev/null 2>&1 || { error "npm is required. Install it from https://nodejs.org/"; exit 1; }
command -v python3 >/dev/null 2>&1 || { error "Python 3 is required. Install it from https://python.org/"; exit 1; }

PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
info "Node $(node -v), npm $(npm -v), Python $PY_VERSION"
info "All prerequisites met"

# ── PostgreSQL via Docker ───────────────────────────────────────────────────
step "PostgreSQL"

CONTAINER_NAME="sutra_ai_db"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "PostgreSQL container already running"
elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "Starting existing PostgreSQL container..."
    docker start "$CONTAINER_NAME"
else
    info "Starting new PostgreSQL 17 container..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        -e POSTGRES_USER=sutra_ai_user \
        -e POSTGRES_PASSWORD=abcd \
        -e POSTGRES_DB=sutra_ai \
        -p 5432:5432 \
        postgres:17
fi

info "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker exec "$CONTAINER_NAME" pg_isready -U sutra_ai_user >/dev/null 2>&1; then
        info "PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        error "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# ── Backend .env ────────────────────────────────────────────────────────────
step "Backend configuration"

if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
DATABASE_URL=postgresql+psycopg://sutra_ai_user:abcd@localhost:5432/sutra_ai
CLERK_WEBHOOK_SECRET=
CLERK_SECRET_KEY=
CLERK_JWKS_URL=
CLERK_ISSUER=
CLERK_AUTHORIZED_PARTIES=http://localhost:3000,http://127.0.0.1:3000
EOF
    warn "backend/.env created — you must add Clerk keys for authentication to work"
    warn "  - CLERK_WEBHOOK_SECRET (from Clerk Dashboard > Webhooks)"
    warn "  - CLERK_SECRET_KEY    (from Clerk Dashboard > API Keys)"
    warn "  - CLERK_JWKS_URL      (e.g. https://your-clerk-api/.well-known/jwks.json)"
    warn "  - CLERK_ISSUER        (e.g. https://your-clerk-api)"
else
    info "backend/.env already exists (skipped)"
fi

# ── Backend virtual environment ─────────────────────────────────────────────
step "Backend Python virtual environment"

if [ ! -d backend/.venv ]; then
    python3 -m venv backend/.venv
    info "Virtual environment created"
else
    info "Virtual environment already exists"
fi

info "Installing Python dependencies..."
backend/.venv/bin/pip install -q -r backend/requirements.txt
info "Dependencies installed"

# ── Apply migrations ───────────────────────────────────────────────────────
step "Database migrations"

for migration in backend/migrations/*.sql; do
    name=$(basename "$migration")
    info "Running $name..."
    docker exec -i "$CONTAINER_NAME" psql -U sutra_ai_user -d sutra_ai < "$migration" >/dev/null 2>&1
done
info "All migrations applied"

# ── Seed demo data ─────────────────────────────────────────────────────────
step "Demo data"

backend/.venv/bin/python backend/scripts/seed_demo_pyq.py
info "Demo PYQ data seeded (150 questions with MCQ options)"

# ── Frontend .env.local ─────────────────────────────────────────────────────
step "Frontend configuration"

if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
EOF
    warn "frontend/.env.local created — you must add Clerk keys for authentication to work"
    warn "  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk Dashboard > API Keys)"
    warn "  - CLERK_SECRET_KEY                  (from Clerk Dashboard > API Keys)"
else
    info "frontend/.env.local already exists (skipped)"
fi

# ── Frontend dependencies ───────────────────────────────────────────────────
step "Frontend dependencies"

cd frontend
if [ ! -d node_modules ]; then
    npm install
    info "Frontend dependencies installed"
else
    info "node_modules already exists (skipped — run 'npm install' manually if needed)"
fi
cd "$ROOT_DIR"

# ── Done ────────────────────────────────────────────────────────────────────
step "Setup complete"

echo ""
echo -e "  ${GREEN}✓${NC} PostgreSQL running on port 5432"
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
echo -e "  ${GREEN}✓${NC} Database migrations applied"
echo -e "  ${GREEN}✓${NC} Demo data seeded (150 questions)"
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  Start the servers:                                     │"
echo "  │                                                         │"
echo "  │  Backend:  cd backend && .venv/bin/uvicorn              │"
echo "  │              app.main:app --reload                      │"
echo "  │                                                         │"
echo "  │  Frontend: cd frontend && npm run dev                   │"
echo "  │                                                         │"
echo "  │  Backend:  http://127.0.0.1:8000                       │"
echo "  │  Frontend: http://localhost:3000                        │"
echo "  │  API docs: http://127.0.0.1:8000/docs                  │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
warn "Don't forget to add your Clerk API keys to:"
echo -e "     ${YELLOW}•${NC} backend/.env"
echo -e "     ${YELLOW}•${NC} frontend/.env.local"
echo ""
