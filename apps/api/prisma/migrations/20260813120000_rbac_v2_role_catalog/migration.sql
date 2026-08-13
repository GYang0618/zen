-- Role RBAC v2: kind/expiresAt/icon + permission catalog fields + field policies

CREATE TYPE "RoleKind" AS ENUM ('system', 'custom');
CREATE TYPE "PermissionStatus" AS ENUM ('active', 'deprecated');
CREATE TYPE "FieldAccess" AS ENUM ('none', 'masked', 'read', 'write');

ALTER TABLE "roles"
  ADD COLUMN IF NOT EXISTS "kind" "RoleKind" NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "icon" TEXT,
  ADD COLUMN IF NOT EXISTS "icon_color" TEXT;

UPDATE "roles"
SET "kind" = 'system'
WHERE "is_system" = true;

ALTER TABLE "permissions"
  ADD COLUMN IF NOT EXISTS "resource" TEXT,
  ADD COLUMN IF NOT EXISTS "action" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "PermissionStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "source" TEXT;

UPDATE "permissions"
SET
  "resource" = split_part("code", ':', 2),
  "action" = split_part("code", ':', 3),
  "source" = CASE
    WHEN "code" LIKE 'system:%' THEN 'kernel'
    WHEN "code" LIKE 'demo:%' THEN 'plugin:demo-notes'
    WHEN "code" LIKE 'notif:%' THEN 'plugin:notifications'
    WHEN "code" LIKE 'file:%' THEN 'plugin:files'
    WHEN "code" LIKE 'job:%' THEN 'plugin:jobs'
    ELSE 'kernel'
  END
WHERE "resource" IS NULL OR "action" IS NULL OR "source" IS NULL;

UPDATE "permissions"
SET "status" = 'deprecated'
WHERE "code" IN ('system:session:list', 'system:session:revoke');

CREATE INDEX IF NOT EXISTS "roles_kind_idx" ON "roles"("kind");
CREATE INDEX IF NOT EXISTS "roles_expires_at_idx" ON "roles"("expires_at");
CREATE INDEX IF NOT EXISTS "permissions_status_idx" ON "permissions"("status");

CREATE TABLE IF NOT EXISTS "role_field_policies" (
  "id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "field_key" TEXT NOT NULL,
  "access" "FieldAccess" NOT NULL DEFAULT 'read',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "role_field_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_field_policies_role_id_resource_field_key_key"
  ON "role_field_policies"("role_id", "resource", "field_key");

CREATE INDEX IF NOT EXISTS "role_field_policies_role_id_idx" ON "role_field_policies"("role_id");

ALTER TABLE "role_field_policies"
  DROP CONSTRAINT IF EXISTS "role_field_policies_role_id_fkey";

ALTER TABLE "role_field_policies"
  ADD CONSTRAINT "role_field_policies_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
