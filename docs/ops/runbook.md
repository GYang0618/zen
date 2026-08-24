# 运维 Runbook

## 本地 / 预发一键启动

```bash
docker compose up -d --build
```

- Web: http://localhost:8080
- API: http://localhost:3001/api/health
- Metrics: http://localhost:3001/api/metrics
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001（账号 `zen` / `zenminio_secret`）
- MinIO 数据目录：仓库内 `data/minio` → 容器 `/bitnami/minio/data`（`restart: unless-stopped`，Docker 启动后自动拉起 Postgres 与 MinIO）

仅启动本地存储与数据库（开发 API 时）：

```bash
docker compose up -d zen-postgres zen-minio
```

## 数据库迁移

```bash
pnpm -F api exec prisma migrate deploy
```

## 回滚

1. 回退应用镜像版本
2. 必要时执行对应 migration 逆向 SQL（需 DBA 审核）
3. 验证 `/api/health` 与登录链路

## 备份与恢复

```bash
# 备份
docker compose exec zen-postgres pg_dump -U admin admin_dev > backup.sql
# 恢复
cat backup.sql | docker compose exec -T zen-postgres psql -U admin admin_dev
```

## 密钥轮换

1. 更新 `JWT_SECRET`
2. 滚动重启 API 实例
3. 用户需重新登录（Refresh Session 失效）
