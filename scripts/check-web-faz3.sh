#!/bin/bash
cd /workspace
echo "=== TYPECHECK WEB ==="
pnpm --filter @saas/web typecheck 2>&1 | tail -25
