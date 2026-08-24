-- 内核文件资产表
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
    "owner_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "declared_mime" TEXT NOT NULL,
    "detected_mime" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "sha256" TEXT,
    "provider" TEXT NOT NULL DEFAULT 's3',
    "storage_key" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "purge_after" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "upload_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
    "file_id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'presign_put',
    "provider_upload_id" TEXT,
    "idempotency_key" TEXT,
    "status" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_bindings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
    "file_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_bindings_pkey" PRIMARY KEY ("id")
);

-- 迁移历史 stored_files
INSERT INTO "file_assets" (
    "id",
    "tenant_id",
    "owner_id",
    "organization_id",
    "purpose",
    "status",
    "original_name",
    "declared_mime",
    "detected_mime",
    "size",
    "sha256",
    "provider",
    "storage_key",
    "expires_at",
    "deleted_at",
    "purge_after",
    "created_at",
    "updated_at"
)
SELECT
    sf."id",
    sf."tenant_id",
    sf."owner_id",
    NULL,
    'legacy',
    CASE WHEN sf."deleted_at" IS NULL THEN 'ready' ELSE 'deleted' END,
    sf."filename",
    COALESCE(sf."mime_type", 'application/octet-stream'),
    sf."mime_type",
    sf."size",
    NULL,
    's3',
    sf."storage_key",
    NULL,
    sf."deleted_at",
    CASE WHEN sf."deleted_at" IS NULL THEN NULL ELSE sf."deleted_at" + INTERVAL '30 days' END,
    sf."created_at",
    sf."updated_at"
FROM "stored_files" sf;

DROP TABLE "stored_files";

-- 头像相对下载路径改为 file:{id}
UPDATE "user_profiles"
SET "avatar" = 'file:' || substring("avatar" FROM '/files/([^/]+)/download')
WHERE "avatar" ~ '^/files/[^/]+/download$';

UPDATE "user_profiles"
SET "avatar" = 'file:' || substring("avatar" FROM '/files/([^/]+)/url')
WHERE "avatar" ~ '^/files/[^/]+/url$';

DELETE FROM "plugin_installations" WHERE "plugin_id" = 'files';

CREATE INDEX "file_assets_tenant_id_owner_id_idx" ON "file_assets"("tenant_id", "owner_id");
CREATE INDEX "file_assets_tenant_id_status_idx" ON "file_assets"("tenant_id", "status");
CREATE INDEX "file_assets_tenant_id_purpose_idx" ON "file_assets"("tenant_id", "purpose");
CREATE INDEX "file_assets_organization_id_idx" ON "file_assets"("organization_id");
CREATE INDEX "file_assets_deleted_at_idx" ON "file_assets"("deleted_at");
CREATE INDEX "file_assets_purge_after_idx" ON "file_assets"("purge_after");
CREATE INDEX "file_assets_sha256_idx" ON "file_assets"("sha256");

CREATE UNIQUE INDEX "upload_sessions_tenant_id_idempotency_key_key" ON "upload_sessions"("tenant_id", "idempotency_key");
CREATE INDEX "upload_sessions_file_id_idx" ON "upload_sessions"("file_id");
CREATE INDEX "upload_sessions_expires_at_status_idx" ON "upload_sessions"("expires_at", "status");

CREATE UNIQUE INDEX "file_bindings_file_id_resource_type_resource_id_relation_key" ON "file_bindings"("file_id", "resource_type", "resource_id", "relation");
CREATE INDEX "file_bindings_tenant_id_resource_type_resource_id_idx" ON "file_bindings"("tenant_id", "resource_type", "resource_id");

ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_bindings" ADD CONSTRAINT "file_bindings_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
