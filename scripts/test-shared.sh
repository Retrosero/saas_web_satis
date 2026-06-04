#!/bin/bash
cd /workspace
echo "=== TEST SHARED ==="
pnpm --filter @saas/shared test 2>&1 | tail -60
