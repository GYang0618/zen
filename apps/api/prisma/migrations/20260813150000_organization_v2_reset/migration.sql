-- Organization V2 is an intentional destructive reset. Existing organization,
-- position, membership and organization-scoped demo data is not preserved.

UPDATE "roles"
SET "custom_org_ids" = ARRAY[]::TEXT[]
WHERE cardinality("custom_org_ids") > 0;

DELETE FROM "demo_notes";
DELETE FROM "user_organizations";
DELETE FROM "posts";
DELETE FROM "organizations";

ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'group';
ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'center';

DROP INDEX IF EXISTS "organizations_status_idx";
DROP INDEX IF EXISTS "posts_status_idx";

ALTER TABLE "organizations"
  DROP COLUMN "status",
  DROP COLUMN "sort",
  ADD COLUMN "effective_date" DATE NOT NULL;

-- PostgreSQL forbids mixing DROP COLUMN and RENAME COLUMN in one ALTER TABLE.
ALTER TABLE "posts"
  DROP COLUMN "status",
  DROP COLUMN "sort";

ALTER TABLE "posts"
  RENAME COLUMN "grade" TO "level";

ALTER TABLE "posts"
  ALTER COLUMN "level" SET NOT NULL;
