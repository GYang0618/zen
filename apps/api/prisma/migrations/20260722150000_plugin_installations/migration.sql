-- Plugin installations + permission codes

CREATE TYPE "PluginInstallStatus" AS ENUM ('active', 'inactive');

CREATE TABLE "plugin_installations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plugin_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "PluginInstallStatus" NOT NULL DEFAULT 'active',
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_installations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plugin_installations_tenant_id_plugin_id_key" ON "plugin_installations"("tenant_id", "plugin_id");
CREATE INDEX "plugin_installations_tenant_id_status_idx" ON "plugin_installations"("tenant_id", "status");
CREATE INDEX "plugin_installations_plugin_id_idx" ON "plugin_installations"("plugin_id");

INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000020', 'system:plugin:list', '查看插件列表', '插件管理', '查看已发现插件与安装状态', NOW(), NOW()),
  ('cmperm0000000000000000021', 'system:plugin:manage', '管理插件启停', '插件管理', '启用或停用插件', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
  AND p."code" IN ('system:plugin:list', 'system:plugin:manage')
ON CONFLICT DO NOTHING;

-- Seed hello-stub installation for default tenant
INSERT INTO "plugin_installations" ("id", "tenant_id", "plugin_id", "version", "status", "config", "created_at", "updated_at")
VALUES
  (
    'cmplugin00000000000000001',
    'cmtenant00000000000000001',
    'hello-stub',
    '0.1.0',
    'active',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("tenant_id", "plugin_id") DO NOTHING;
