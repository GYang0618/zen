/*
  Warnings:

  - The values [disabled] on the enum `UserStatusCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserStatusCode_new" AS ENUM ('active', 'inactive', 'pending', 'suspended');
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatusCode_new" USING ("status"::text::"UserStatusCode_new");
ALTER TYPE "UserStatusCode" RENAME TO "UserStatusCode_old";
ALTER TYPE "UserStatusCode_new" RENAME TO "UserStatusCode";
DROP TYPE "public"."UserStatusCode_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;
