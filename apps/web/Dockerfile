# Multi-stage Dockerfile — React/Vite web (production)

FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml .npmrc* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @saas/web...

FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo /repo
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME="SaaS İşletme Yönetimi"
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
RUN pnpm --filter @saas/shared build
RUN pnpm --filter @saas/web build

FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
