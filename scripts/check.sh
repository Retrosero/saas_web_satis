#!/bin/bash
set -e
cd /workspace
echo "=== TYPECHECK API ==="
pnpm --filter @saas/api typecheck 2>&1 | tail -25
