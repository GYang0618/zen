-- 媒体分类；并清空历史文件元数据与头像 file: 引用
ALTER TABLE "file_assets" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';

CREATE INDEX "file_assets_tenant_id_category_idx" ON "file_assets"("tenant_id", "category");

TRUNCATE TABLE "file_bindings", "upload_sessions", "file_assets";

UPDATE "user_profiles"
SET "avatar" = NULL
WHERE "avatar" LIKE 'file:%'
   OR "avatar" LIKE '%/files/%';
