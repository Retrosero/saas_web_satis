# Multi-stage Dockerfile — NestJS API (production)
# Build: docker build -t saas-api -f apps/api/Dockerfile .

# ---- 1. Dependencies ----
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml .npmrc* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @saas/api...

# ---- 2. Builder ----
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo /repo
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm --filter @saas/shared build
RUN pnpm --filter @saas/api prisma:generate
RUN pnpm --filter @saas/api build

# ---- 3. Runner ----
FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/prisma ./prisma
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/packages ./packages
EXPOSE 3000
CMD ["node", "dist/main.js"]
