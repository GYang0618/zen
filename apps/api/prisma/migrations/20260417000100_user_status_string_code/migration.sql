CREATE TYPE "UserStatusCode" AS ENUM ('active', 'disabled');

ALTER TABLE "users"
ADD COLUMN "status_new" "UserStatusCode" NOT NULL DEFAULT 'active';

UPDATE "users"
SET "status_new" = CASE
  WHEN "status" = 0 THEN 'disabled'::"UserStatusCode"
  ELSE 'active'::"UserStatusCode"
END;

ALTER TABLE "users" DROP COLUMN "status";
ALTER TABLE "users" RENAME COLUMN "status_new" TO "status";
