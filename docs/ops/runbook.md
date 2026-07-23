# 运维 Runbook

## 本地 / 预发一键启动

```bash
docker compose up -d --build
```

- Web: http://localhost:8080
- API: http://localhost:3001/api/health
- Metrics: http://localhost:3001/api/metrics

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
docker compose exec db pg_dump -U zen admin_dev > backup.sql
# 恢复
cat backup.sql | docker compose exec -T db psql -U zen admin_dev
```

## 密钥轮换

1. 更新 `JWT_SECRET`
2. 滚动重启 API 实例
3. 用户需重新登录（Refresh Session 失效）
