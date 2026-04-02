# Admin Server

## 技术栈

- NestJS + Fastify Adapter
- PostgreSQL + Prisma
- @nestjs/config + zod 配置校验
- pino + nestjs-pino 日志

## 快速开始

1. 复制环境变量模板

```bash
cp .env.example .env
```

2. 安装依赖（在仓库根目录执行）

```bash
pnpm install
```

3. 生成 Prisma Client

```bash
pnpm --filter server prisma:generate
```

4. 启动服务

```bash
pnpm --filter server dev
```

## 使用 Docker 运行 PostgreSQL

在仓库根目录执行：

```bash
docker compose up -d
```

默认数据库参数（已与 `.env.example` / `.env.development` 对齐）：

- Host: `localhost`
- Port: `5432`
- User: `admin`
- Password: `admin123`
- Database: `admin_dev`

连接串示例：

```bash
DATABASE_URL=postgresql://admin:admin123@localhost:5432/admin_dev?schema=public
```

## Prisma 创建数据库结构

在仓库根目录执行（会根据 `prisma/schema.prisma` 创建迁移并建表）：

```bash
pnpm --filter server exec prisma migrate dev --name init
```

可选：仅检查迁移状态

```bash
pnpm --filter server exec prisma migrate status
```

## 配置说明

- `DATABASE_URL` 默认可直接连接本地 Docker PostgreSQL，也可按实际环境替换。
- 配置集中在 `src/config`：
	- `env.schema.ts`：zod 规则
	- `validate.ts`：环境变量校验
	- `modules/*.config.ts`：按命名空间拆分的配置工厂
	- `types.ts`：配置类型映射
	- `config.module.ts`：全局配置模块

## 目录结构（核心）

- `src/modules`：业务模块（`health`、`users`）
- `src/infrastructure`：基础设施层（`logger`、`prisma`）
- `src/config`：配置聚合与校验

## Prisma Demo

- schema 位于 `prisma/schema.prisma`
- demo 模块位于 `src/modules/users`
	- `GET /users` 查询用户
	- `POST /users` 创建用户

## 健康检查

- `GET /health`：服务健康检查