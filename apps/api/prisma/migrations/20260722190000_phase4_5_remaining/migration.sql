-- MFA secret + capability plugin tables + step-up support seed permissions

ALTER TABLE "user_security"
ADD COLUMN IF NOT EXISTS "mfa_secret" TEXT;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_tenant_id_user_id_idx" ON "notifications"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "stored_files" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
  "owner_id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mime_type" TEXT,
  "size" INTEGER NOT NULL DEFAULT 0,
  "storage_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stored_files_tenant_id_owner_id_idx" ON "stored_files"("tenant_id", "owner_id");
CREATE INDEX IF NOT EXISTS "stored_files_deleted_at_idx" ON "stored_files"("deleted_at");

DO $$ BEGIN
  ALTER TABLE "stored_files"
    ADD CONSTRAINT "stored_files_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "job_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL DEFAULT 'cmtenant00000000000000001',
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payload" JSONB,
  "result" JSONB,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  CONSTRAINT "job_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "job_records_tenant_id_status_idx" ON "job_records"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "job_records_created_at_idx" ON "job_records"("created_at");

INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000050', 'notif:message:list', '查看通知', '通知', '查看站内通知', NOW(), NOW()),
  ('cmperm0000000000000000051', 'notif:message:manage', '管理通知', '通知', '发送或标记通知', NOW(), NOW()),
  ('cmperm0000000000000000052', 'file:object:list', '查看文件', '文件', '查看文件列表', NOW(), NOW()),
  ('cmperm0000000000000000053', 'file:object:manage', '管理文件', '文件', '上传删除文件', NOW(), NOW()),
  ('cmperm0000000000000000054', 'job:task:list', '查看任务', '任务', '查看异步任务', NOW(), NOW()),
  ('cmperm0000000000000000055', 'job:task:manage', '管理任务', '任务', '创建异步任务', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
  AND p."code" IN (
    'notif:message:list', 'notif:message:manage',
    'file:object:list', 'file:object:manage',
    'job:task:list', 'job:task:manage'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "plugin_installations" ("id", "tenant_id", "plugin_id", "version", "status", "config", "created_at", "updated_at")
VALUES
  ('cminstall0000000000000002', 'cmtenant00000000000000001', 'notifications', '0.1.0', 'active', '{}', NOW(), NOW()),
  ('cminstall0000000000000003', 'cmtenant00000000000000001', 'files', '0.1.0', 'active', '{}', NOW(), NOW()),
  ('cminstall0000000000000004', 'cmtenant00000000000000001', 'jobs', '0.1.0', 'active', '{}', NOW(), NOW())
ON CONFLICT ("tenant_id", "plugin_id") DO NOTHING;
