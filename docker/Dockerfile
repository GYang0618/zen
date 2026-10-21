# 本地部署镜像。构建上下文是仓库根目录。
FROM node:24-alpine AS workspace

RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV CI=true
ENV TURBO_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY . .
RUN corepack enable && corepack install && pnpm install --frozen-lockfile
# prisma.config.ts 读取该变量。生成客户端时不会连库，运行时由 Compose 覆盖。
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
RUN pnpm -F api prisma:generate

FROM workspace AS api

RUN pnpm -F api build
WORKDIR /app/apps/api
EXPOSE 3100
CMD ["sh", "/app/docker/api-entrypoint.sh"]

FROM workspace AS agent

RUN test -s apps/api/swagger.json || (echo "缺少 apps/api/swagger.json，无法生成 Agent API 客户端" && exit 1)
RUN pnpm exec turbo run build --filter=agent
WORKDIR /app/apps/agent
EXPOSE 3600
CMD ["sh", "/app/docker/agent-entrypoint.sh"]

FROM workspace AS web-build

ARG VITE_APP_NAME
ARG VITE_APP_BASE_URL
ARG VITE_APP_API_TIMEOUT
ARG VITE_APP_CHAT_API
ARG VITE_APP_COPILOT_KIT_API
ENV VITE_APP_NAME=$VITE_APP_NAME \
  VITE_APP_BASE_URL=$VITE_APP_BASE_URL \
  VITE_APP_API_TIMEOUT=$VITE_APP_API_TIMEOUT \
  VITE_APP_CHAT_API=$VITE_APP_CHAT_API \
  VITE_APP_COPILOT_KIT_API=$VITE_APP_COPILOT_KIT_API \
  NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm exec turbo run build --filter=web

FROM nginx:1.27-alpine AS web

RUN rm /etc/nginx/conf.d/default.conf \
  && apk add --no-cache wget
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM_PORT
ENV API_UPSTREAM_PORT=3100
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
