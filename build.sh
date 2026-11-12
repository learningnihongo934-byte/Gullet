#!/bin/bash
# Gullet build script.
#   ./build.sh          run locally (game + co-op relay) at http://localhost:8830
#   ./build.sh test     syntax check + headless simulation smoke test (tools/smoke.mjs)
#   ./build.sh deploy   deploy to Cloudflare Workers (https://gullet.rennko.tech)
set -euo pipefail
cd "$(dirname "$0")"
case "${1:-dev}" in
  dev) npx -y wrangler@4 dev --port 8830 ;;
  test)
    for f in web/js/*.js src/*.js tools/*.mjs; do node --check "$f"; done
    node tools/smoke.mjs
    ;;
  deploy) npx -y wrangler@4 deploy ;;
  *) sed -n '2,5p' "$0"; exit 1 ;;
esac
