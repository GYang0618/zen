-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "trace_id" TEXT,
    "diff" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_trace_id_idx" ON "audit_logs"("trace_id");

-- Seed default tenant (Tenant-ready, single-tenant delivery)
INSERT INTO "tenants" ("id", "code", "name", "status", "settings", "created_at", "updated_at")
VALUES (
  'cmtenant00000000000000001',
  'default',
  '默认租户',
  'active',
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT ("code") DO NOTHING;

-- Seed organization / audit / dict permissions for Phase 1 readiness
INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000011', 'system:org:list', '查看组织', '组织管理', '查询组织树与成员', NOW(), NOW()),
  ('cmperm0000000000000000012', 'system:org:create', '创建组织', '组织管理', '创建组织节点', NOW(), NOW()),
  ('cmperm0000000000000000013', 'system:org:update', '编辑组织', '组织管理', '更新组织信息与结构', NOW(), NOW()),
  ('cmperm0000000000000000014', 'system:org:delete', '删除组织', '组织管理', '删除组织节点', NOW(), NOW()),
  ('cmperm0000000000000000015', 'system:audit:list', '查看审计日志', '审计', '查询操作与登录审计', NOW(), NOW()),
  ('cmperm0000000000000000016', 'system:dict:list', '查看字典', '系统配置', '查询系统字典', NOW(), NOW()),
  ('cmperm0000000000000000017', 'system:dict:manage', '管理字典', '系统配置', '维护系统字典', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Bind new permissions to super_admin
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
  AND p."code" IN (
    'system:org:list',
    'system:org:create',
    'system:org:update',
    'system:org:delete',
    'system:audit:list',
    'system:dict:list',
    'system:dict:manage'
  )
ON CONFLICT DO NOTHING;
