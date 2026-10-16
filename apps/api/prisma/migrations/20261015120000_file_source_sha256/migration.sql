-- 原文件 SHA-256，供同一所有者的内容去重。部分唯一索引不进 Prisma schema：
-- Prisma 无法表达 NULLS NOT DISTINCT 的部分唯一约束，后续迁移不要删除该索引。
ALTER TABLE "file_assets" ADD COLUMN "source_sha256" TEXT;

CREATE INDEX "file_assets_tenant_id_owner_id_purpose_source_sha256_idx"
ON "file_assets"("tenant_id", "owner_id", "purpose", "source_sha256");

CREATE UNIQUE INDEX "file_assets_active_source_sha256_key"
ON "file_assets" ("tenant_id", "owner_id", "purpose", "organization_id", "source_sha256")
NULLS NOT DISTINCT
WHERE "source_sha256" IS NOT NULL
  AND "deleted_at" IS NULL
  AND "status" IN ('pending', 'uploaded', 'ready');
