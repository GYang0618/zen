-- Phase 1/2 remaining permission seeds

INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000040', 'system:session:list', '查看登录会话', '会话管理', '查看当前用户活跃会话', NOW(), NOW()),
  ('cmperm0000000000000000041', 'system:session:revoke', '撤销登录会话', '会话管理', '强制下线指定会话', NOW(), NOW()),
  ('cmperm0000000000000000042', 'system:post:list', '查看岗位', '岗位管理', '查看组织岗位', NOW(), NOW()),
  ('cmperm0000000000000000043', 'system:post:manage', '管理岗位', '岗位管理', '创建更新删除岗位', NOW(), NOW()),
  ('cmperm0000000000000000044', 'system:config:list', '查看系统配置', '系统配置', '查看站点配置', NOW(), NOW()),
  ('cmperm0000000000000000045', 'system:config:manage', '管理系统配置', '系统配置', '更新站点配置', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
  AND p."code" IN (
    'system:session:list',
    'system:session:revoke',
    'system:post:list',
    'system:post:manage',
    'system:config:list',
    'system:config:manage',
    'system:audit:list',
    'system:dict:list',
    'system:dict:manage',
    'system:plugin:list',
    'system:plugin:manage'
  )
ON CONFLICT DO NOTHING;
