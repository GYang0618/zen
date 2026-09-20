-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "user_roles_is_primary_idx" ON "user_roles"("is_primary");

-- Backfill: mark the earliest role as primary for each user
UPDATE "user_roles" AS ur
SET "is_primary" = true
FROM (
  SELECT DISTINCT ON ("user_id") "user_id", "role_id"
  FROM "user_roles"
  ORDER BY "user_id", "created_at" ASC
) AS first_role
WHERE ur."user_id" = first_role."user_id"
  AND ur."role_id" = first_role."role_id";
