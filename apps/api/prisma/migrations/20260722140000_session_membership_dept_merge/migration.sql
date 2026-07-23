-- Session / Membership tables
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_tenant_id_idx" ON "sessions"("tenant_id");
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

CREATE UNIQUE INDEX "memberships_tenant_id_user_id_key" ON "memberships"("tenant_id", "user_id");
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate refresh tokens into sessions
INSERT INTO "sessions" ("id", "user_id", "tenant_id", "refresh_token_hash", "expires_at", "revoked_at", "ip", "user_agent", "created_at", "updated_at")
SELECT
  md5(random()::text || clock_timestamp()::text || u."id"),
  u."id",
  'cmtenant00000000000000001',
  u."refresh_token_hash",
  u."refresh_token_expires_at",
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM "users" u
WHERE u."refresh_token_hash" IS NOT NULL
  AND u."refresh_token_expires_at" IS NOT NULL;

-- Seed memberships for all users under default tenant
INSERT INTO "memberships" ("id", "tenant_id", "user_id", "status", "created_at", "updated_at")
SELECT
  md5(random()::text || clock_timestamp()::text || u."id"),
  'cmtenant00000000000000001',
  u."id",
  'active',
  NOW(),
  NOW()
FROM "users" u
ON CONFLICT ("tenant_id", "user_id") DO NOTHING;

-- Department → Organization mapping
CREATE TEMP TABLE "dept_org_map" (
  "dept_id" TEXT PRIMARY KEY,
  "org_id" TEXT NOT NULL
);

-- Non-conflicting departments keep their id as organization id
INSERT INTO "organizations" (
  "id", "code", "name", "type", "parent_id", "leader_id", "description", "status", "sort", "path", "level", "created_at", "updated_at"
)
SELECT
  d."id",
  d."code",
  d."name",
  'department',
  NULL,
  NULL,
  d."description",
  d."status",
  d."sort",
  NULL,
  1,
  d."created_at",
  d."updated_at"
FROM "departments" d
WHERE NOT EXISTS (
  SELECT 1 FROM "organizations" o WHERE o."code" = d."code"
);

INSERT INTO "dept_org_map" ("dept_id", "org_id")
SELECT d."id", d."id"
FROM "departments" d
WHERE EXISTS (SELECT 1 FROM "organizations" o WHERE o."id" = d."id");

-- Conflicting codes map onto existing organizations
INSERT INTO "dept_org_map" ("dept_id", "org_id")
SELECT d."id", o."id"
FROM "departments" d
JOIN "organizations" o ON o."code" = d."code"
WHERE NOT EXISTS (SELECT 1 FROM "dept_org_map" m WHERE m."dept_id" = d."id");

-- Wire parent relations for newly inserted department orgs
UPDATE "organizations" org
SET "parent_id" = mapped."org_id"
FROM "departments" d
JOIN "dept_org_map" mapped ON mapped."dept_id" = d."parent_id"
WHERE org."id" = d."id"
  AND d."parent_id" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "dept_org_map" self WHERE self."dept_id" = d."id" AND self."org_id" = d."id");

-- Rebuild all organization paths from parent_id
WITH RECURSIVE "tree" AS (
  SELECT
    o."id",
    o."parent_id",
    ('/' || o."id" || '/') AS "path",
    1 AS "level"
  FROM "organizations" o
  WHERE o."parent_id" IS NULL
  UNION ALL
  SELECT
    c."id",
    c."parent_id",
    (t."path" || c."id" || '/') AS "path",
    t."level" + 1 AS "level"
  FROM "organizations" c
  INNER JOIN "tree" t ON c."parent_id" = t."id"
)
UPDATE "organizations" o
SET "path" = t."path",
    "level" = t."level"
FROM "tree" t
WHERE o."id" = t."id";

-- Migrate memberships UserDepartment → UserOrganization
INSERT INTO "user_organizations" (
  "user_id", "organization_id", "post_id", "is_primary", "joined_at", "left_at", "created_at", "updated_at"
)
SELECT
  ud."user_id",
  m."org_id",
  NULL,
  ud."is_primary",
  NULL,
  NULL,
  ud."created_at",
  NOW()
FROM "user_departments" ud
JOIN "dept_org_map" m ON m."dept_id" = ud."department_id"
ON CONFLICT ("user_id", "organization_id") DO UPDATE
SET "is_primary" = "user_organizations"."is_primary" OR EXCLUDED."is_primary";

-- Ensure at most one primary org per user (keep earliest)
WITH ranked AS (
  SELECT
    "user_id",
    "organization_id",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id"
      ORDER BY "is_primary" DESC, "created_at" ASC
    ) AS rn
  FROM "user_organizations"
  WHERE "left_at" IS NULL
)
UPDATE "user_organizations" uo
SET "is_primary" = (ranked.rn = 1)
FROM ranked
WHERE uo."user_id" = ranked."user_id"
  AND uo."organization_id" = ranked."organization_id";

-- Drop legacy refresh columns and department tables
ALTER TABLE "users" DROP COLUMN IF EXISTS "refresh_token_hash";
ALTER TABLE "users" DROP COLUMN IF EXISTS "refresh_token_expires_at";

DROP TABLE IF EXISTS "user_departments";
DROP TABLE IF EXISTS "departments";
