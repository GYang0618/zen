-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MfaType" AS ENUM ('TOTP', 'SMS', 'EMAIL', 'OFF');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "user_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "real_name" TEXT,
  "avatar" TEXT,
  "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
  "job_title" TEXT,
  "remark" TEXT,
  "meta" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_security" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
  "mfa_type" "MfaType" NOT NULL DEFAULT 'OFF',
  "password_expire_at" TIMESTAMP(3),
  "last_password_change" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'zh-CN',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
  "notify_by_email" BOOLEAN NOT NULL DEFAULT true,
  "notify_by_push" BOOLEAN NOT NULL DEFAULT true,
  "notify_by_sms" BOOLEAN NOT NULL DEFAULT false,
  "dashboard_settings" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_audit" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  "last_login_at" TIMESTAMP(3),
  "last_login_ip" TEXT,
  "last_active_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "module" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
  "user_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

-- CreateTable
CREATE TABLE "departments" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parent_id" TEXT,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_departments" (
  "user_id" TEXT NOT NULL,
  "department_id" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_departments_pkey" PRIMARY KEY ("user_id", "department_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_gender_idx" ON "user_profiles"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_user_id_key" ON "user_security"("user_id");

-- CreateIndex
CREATE INDEX "user_security_mfa_enabled_idx" ON "user_security"("mfa_enabled");

-- CreateIndex
CREATE INDEX "user_security_mfa_type_idx" ON "user_security"("mfa_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_preferences_theme_idx" ON "user_preferences"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "user_audit_user_id_key" ON "user_audit"("user_id");

-- CreateIndex
CREATE INDEX "user_audit_last_login_at_idx" ON "user_audit"("last_login_at");

-- CreateIndex
CREATE INDEX "user_audit_last_active_at_idx" ON "user_audit"("last_active_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_status_idx" ON "roles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "departments"("parent_id");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE INDEX "user_departments_department_id_idx" ON "user_departments"("department_id");

-- AddForeignKey
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_security"
ADD CONSTRAINT "user_security_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"
ADD CONSTRAINT "user_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit"
ADD CONSTRAINT "user_audit_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles"
ADD CONSTRAINT "user_roles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles"
ADD CONSTRAINT "user_roles_role_id_fkey"
FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_role_id_fkey"
FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_permission_id_fkey"
FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments"
ADD CONSTRAINT "departments_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments"
ADD CONSTRAINT "user_departments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments"
ADD CONSTRAINT "user_departments_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed system roles
INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "status", "sort", "created_at", "updated_at")
VALUES
  ('cm00000000000000000000001', 'super_admin', '超级管理员', '拥有系统所有权限，不可删除', true, 'ACTIVE', 1, NOW(), NOW()),
  ('cm00000000000000000000002', 'guest', '访客', '临时访问权限，仅可查看公开内容', true, 'ACTIVE', 999, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
