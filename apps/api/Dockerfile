# API Dockerfile
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/plugin-sdk/package.json packages/plugin-sdk/
COPY packages/request/package.json packages/request/
COPY packages/ui/package.json packages/ui/
COPY plugins/demo-notes/package.json plugins/demo-notes/
COPY plugins/notifications/package.json plugins/notifications/
COPY plugins/jobs/package.json plugins/jobs/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm -F @zen/shared build \
 && pnpm -F @zen/ui build \
 && pnpm -F @zen/plugin-sdk build \
 && pnpm -F @zen/plugin-demo-notes build \
 && pnpm -F @zen/plugin-notifications build \
 && pnpm -F @zen/plugin-jobs build \
 && pnpm -F api prisma:generate \
 && pnpm -F api build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
