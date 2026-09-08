# AGENTS.md

## Cursor Cloud specific instructions

`zen` is a pnpm + Turborepo monorepo (package manager `pnpm@10.33.0`, Node >=18).

### Services

| Service | Package | Dev command | Port | Required |
| --- | --- | --- | --- | --- |
| Web UI (React 19 + Vite) | `apps/web` | `pnpm web` | 3000 | Yes |
| API (NestJS + Prisma) | `apps/api` | `pnpm api` | 3100 | Yes |
| PostgreSQL | — | see below | 5432 | Yes |
| AI agent (LangGraph) | `apps/agent` | `pnpm -F agent dev` | 3600 | Optional (AI copilot only) |

The core admin product (auth, RBAC, dashboard) needs only web + api + PostgreSQL. The `agent` service, AI chat (`/api/chat`), CopilotKit, and the 3D GIS/BIM asset loading are optional and require external services — an OpenAI-compatible LLM key (DashScope/Qwen `OPENAI_API_KEY`) and an OSS asset server (`VITE_APP_OSS_URL`, :3150) — so they are not needed to run/test the core app.

### Non-obvious setup caveats

- Port collision: both `web` and `api` default to `3000`. Run the API on `3100` (set `PORT=3100` in `apps/api/.env`) and keep web on `3000`.
- `VITE_APP_BASE_URL` MUST include the `/api` suffix (e.g. `http://localhost:3100/api`). The API mounts all routes under the `/api` global prefix, but `apps/web/.env.example` ships the base URL WITHOUT `/api`, which makes auth requests hit `/auth/register` and fail with `Cannot POST /auth/register`. `VITE_APP_CHAT_API` / `VITE_APP_COPILOT_KIT_API` already include `/api`.
- Env files live at `apps/api/.env` and `apps/web/.env` (both gitignored). The API loads `.env.${NODE_ENV}` then `.env`. `JWT_SECRET` must be >= 32 chars or startup fails Zod validation.
- Vite reads env only at startup — restart `pnpm web` after editing `apps/web/.env`.
- `@zen/shared` must be built (`pnpm -F @zen/shared build`) before `api`/`web` run, since they import its compiled output.

### PostgreSQL

PostgreSQL 16 is provided in the VM (the repo's README references `docker compose up` but no compose file exists). Start it and confirm the dev DB exists each session:

```
sudo pg_ctlcluster 16 main start
```

Dev credentials (match `apps/api/.env`): user `admin` / password `admin123` / db `admin_dev` on `localhost:5432`. If the role/db are missing, recreate them, then apply migrations:

```
pnpm -F api exec prisma migrate deploy
```

`pnpm -F api prisma:generate` regenerates the Prisma client (no DB needed).

### Lint / types / tests

- Lint: `pnpm lint` (Biome, runs `biome check --write` so it MUTATES files — revert unrelated auto-fixes before committing).
- Types: `pnpm check-types` (only `web`, `@zen/ui`, `@zen/shared` define this task).
- There are currently no automated test files (no `*.spec.ts`); the API has a Jest config but no specs. Verify changes via the running app.

### Agent service (optional)

`apps/agent` runs `openapi:generate` on `predev`/`prebuild`, reading `apps/api/swagger.json` (produced when the API boots with `SWAGGER_ENABLED=true`). Start the API once before building/running the agent, and provide `OPENAI_API_KEY`.
