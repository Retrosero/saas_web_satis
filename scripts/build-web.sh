#!/bin/bash
cd /workspace
pnpm --filter @saas/web build 2>&1 | tail -10
