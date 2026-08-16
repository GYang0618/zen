-- Split global job profiles from organization headcount positions.

CREATE TYPE "JobProfileStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "OrganizationPositionStatus" AS ENUM ('active', 'frozen');

CREATE TABLE "job_profiles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "family" TEXT,
    "status" "JobProfileStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_profiles_code_key" ON "job_profiles"("code");
CREATE INDEX "job_profiles_status_idx" ON "job_profiles"("status");
CREATE INDEX "job_profiles_name_idx" ON "job_profiles"("name");

-- Seed one job profile per existing post code (codes were globally unique).
INSERT INTO "job_profiles" ("id", "code", "name", "description", "level", "family", "status", "created_at", "updated_at")
SELECT
  "id" || '_profile',
  "code",
  "name",
  "description",
  "level",
  NULL,
  'active'::"JobProfileStatus",
  "created_at",
  "updated_at"
FROM "posts";

ALTER TABLE "posts"
  ADD COLUMN "job_profile_id" TEXT,
  ADD COLUMN "status" "OrganizationPositionStatus" NOT NULL DEFAULT 'active';

UPDATE "posts"
SET "job_profile_id" = "id" || '_profile';

ALTER TABLE "posts"
  ALTER COLUMN "job_profile_id" SET NOT NULL;

ALTER TABLE "posts"
  ALTER COLUMN "level" DROP NOT NULL;

UPDATE "posts"
SET "level" = NULL;

ALTER TABLE "posts"
  DROP CONSTRAINT IF EXISTS "posts_code_key";

DROP INDEX IF EXISTS "posts_code_key";

ALTER TABLE "posts"
  DROP COLUMN "code",
  DROP COLUMN "name";

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_job_profile_id_fkey"
  FOREIGN KEY ("job_profile_id") REFERENCES "job_profiles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "posts_organization_id_job_profile_id_key"
  ON "posts"("organization_id", "job_profile_id");

CREATE INDEX "posts_job_profile_id_idx" ON "posts"("job_profile_id");
CREATE INDEX "posts_status_idx" ON "posts"("status");
