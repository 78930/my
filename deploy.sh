#!/usr/bin/env bash
set -e

echo "🚀 Sketu Backend — Deploy Script"
echo "================================="

# Check Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker Desktop first."
  exit 1
fi

# Generate a JWT secret if not set
if [ -z "$JWT_SECRET" ]; then
  export JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid)
  echo "🔑 Generated JWT_SECRET (save this!): $JWT_SECRET"
fi

echo ""
echo "▶ Starting services with Docker Compose..."
docker compose up --build -d

echo ""
echo "⏳ Waiting for API to be ready..."
for i in {1..15}; do
  if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API is up at http://localhost:5000"
    echo ""
    echo "API routes available:"
    echo "  POST http://localhost:5000/api/auth/register"
    echo "  POST http://localhost:5000/api/auth/login"
    echo "  GET  http://localhost:5000/api/auth/me"
    echo "  GET  http://localhost:5000/api/jobs"
    echo "  POST http://localhost:5000/api/jobs"
    echo "  GET  http://localhost:5000/api/workers/search"
    echo "  GET  http://localhost:5000/api/factories/dashboard/summary"
    echo ""
    echo "📱 Mobile app: set EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:5000 in mobile-app/.env"
    exit 0
  fi
  sleep 2
done

echo "⚠️  API didn't respond in time. Check logs with: docker compose logs api"
