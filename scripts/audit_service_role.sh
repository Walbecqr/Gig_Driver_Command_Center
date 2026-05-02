#!/bin/bash
# Scan for service_role key exposure in client-bundled code.
# Expected output: nothing (zero matches).
set -e
echo "=== Scanning for SERVICE_ROLE in client code ==="
grep -rn "SERVICE_ROLE" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  src/ app/ lib/ components/ hooks/ services/ screens/ 2>/dev/null \
  && echo "❌ CRITICAL: service_role found in client code — fix immediately" \
  || echo "✅ Clean — no service_role references found in client code"

echo ""
echo "=== Scanning for EXPO_PUBLIC_SERVICE_ROLE in .env files ==="
grep -rn "EXPO_PUBLIC.*SERVICE_ROLE" .env* 2>/dev/null \
  && echo "❌ CRITICAL: service_role in EXPO_PUBLIC env var — fix immediately" \
  || echo "✅ Clean — no EXPO_PUBLIC service_role env vars found"
