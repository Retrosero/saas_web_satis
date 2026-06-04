#!/bin/bash
cd /workspace
echo "=== TEST SHARED ==="
pnpm --filter @saas/shared test 2>&1 | tail -10
echo ""
echo "=== BUILD SHARED ==="
pnpm --filter @saas/shared build 2>&1 | tail -5
echo ""
echo "=== TYPECHECK API ==="
pnpm --filter @saas/api typecheck 2>&1 | tail -10
echo ""
echo "=== BUILD API ==="
pnpm --filter @saas/api build 2>&1 | tail -5
echo ""
echo "=== TYPECHECK WEB ==="
pnpm --filter @saas/web typecheck 2>&1 | tail -10
echo ""
echo "=== BUILD WEB ==="
pnpm --filter @saas/web build 2>&1 | tail -10
