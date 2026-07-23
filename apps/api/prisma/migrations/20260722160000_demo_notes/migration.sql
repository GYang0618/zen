-- demo-notes reference plugin

CREATE TABLE "demo_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "demo_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_notes_tenant_id_organization_id_idx" ON "demo_notes"("tenant_id", "organization_id");
CREATE INDEX "demo_notes_tenant_id_created_by_idx" ON "demo_notes"("tenant_id", "created_by");
CREATE INDEX "demo_notes_deleted_at_idx" ON "demo_notes"("deleted_at");

ALTER TABLE "demo_notes" ADD CONSTRAINT "demo_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000030', 'demo:note:list', '查看便签列表', 'demo', '分页或列表查询便签', NOW(), NOW()),
  ('cmperm0000000000000000031', 'demo:note:get', '查看便签详情', 'demo', '按 ID 查看便签', NOW(), NOW()),
  ('cmperm0000000000000000032', 'demo:note:create', '创建便签', 'demo', '创建便签', NOW(), NOW()),
  ('cmperm0000000000000000033', 'demo:note:update', '更新便签', 'demo', '更新便签', NOW(), NOW()),
  ('cmperm0000000000000000034', 'demo:note:delete', '删除便签', 'demo', '删除便签', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
  AND p."code" LIKE 'demo:note:%'
ON CONFLICT DO NOTHING;

INSERT INTO "plugin_installations" ("id", "tenant_id", "plugin_id", "version", "status", "config", "created_at", "updated_at")
VALUES
  (
    'cmplugin00000000000000002',
    'cmtenant00000000000000001',
    'demo-notes',
    '0.1.0',
    'active',
    '{"maxNotesPerUser": 100}',
    NOW(),
    NOW()
  )
ON CONFLICT ("tenant_id", "plugin_id") DO NOTHING;
