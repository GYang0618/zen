-- Seed RBAC permissions and preset roles

-- Permissions: system management
INSERT INTO "permissions" ("id", "code", "name", "module", "description", "created_at", "updated_at")
VALUES
  ('cmperm0000000000000000001', 'system:user:list', '查看用户列表', '用户管理', '分页查询用户列表', NOW(), NOW()),
  ('cmperm0000000000000000002', 'system:user:create', '创建用户', '用户管理', '创建新用户账号', NOW(), NOW()),
  ('cmperm0000000000000000003', 'system:user:update', '编辑用户', '用户管理', '更新用户资料', NOW(), NOW()),
  ('cmperm0000000000000000004', 'system:user:delete', '删除用户', '用户管理', '软删除或物理删除用户', NOW(), NOW()),
  ('cmperm0000000000000000005', 'system:user:status', '变更用户状态', '用户管理', '批量启用或停用用户', NOW(), NOW()),
  ('cmperm0000000000000000006', 'system:role:list', '查看角色列表', '角色管理', '分页查询角色列表', NOW(), NOW()),
  ('cmperm0000000000000000007', 'system:role:create', '创建角色', '角色管理', '创建自定义角色', NOW(), NOW()),
  ('cmperm0000000000000000008', 'system:role:update', '编辑角色', '角色管理', '更新角色信息与权限', NOW(), NOW()),
  ('cmperm0000000000000000009', 'system:role:delete', '删除角色', '角色管理', '删除自定义角色', NOW(), NOW()),
  ('cmperm0000000000000000010', 'system:role:assign', '分配角色权限', '角色管理', '为角色分配权限', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Update super_admin data scope
UPDATE "roles"
SET "data_scope" = 'all', "description" = '拥有系统所有权限，不可删除', "updated_at" = NOW()
WHERE "code" = 'super_admin';

-- Add preset user role (普通用户)
INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "status", "sort", "data_scope", "created_at", "updated_at")
VALUES
  ('cm00000000000000000000003', 'user', '普通用户', '系统默认角色，拥有基础访问权限', true, 'ACTIVE', 10, 'self', NOW(), NOW())
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "is_system" = true,
    "data_scope" = 'self',
    "updated_at" = NOW();

-- Update guest role description
UPDATE "roles"
SET "description" = '临时访问权限，仅可查看公开内容', "data_scope" = 'self', "updated_at" = NOW()
WHERE "code" = 'guest';

-- super_admin gets all permissions
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'super_admin'
ON CONFLICT DO NOTHING;

-- user role gets no admin permissions (empty by design; can be extended later)
