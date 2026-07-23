# Web Dockerfile
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
COPY plugins ./plugins
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
RUN pnpm -F @zen/shared build && pnpm -F web build

FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
