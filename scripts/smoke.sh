#!/usr/bin/env bash
set -euo pipefail

npm run build
node scripts/check-pages-output.mjs

if [[ -z "${PORT:-}" ]]; then
  PORT="$(node -e "const net=require('node:net'); const s=net.createServer(); s.listen(0,'127.0.0.1',()=>{console.log(s.address().port); s.close();});")"
fi

PORT="${PORT}" PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}" node scripts/serve-docs.mjs &
SERVER_PID=$!

cleanup() {
  kill "${SERVER_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${PORT}/research-flow/" >/dev/null; then
    break
  fi
  sleep 0.25
done

PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}" npx playwright test
