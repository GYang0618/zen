-- AlterTable
ALTER TABLE "roles" ADD COLUMN "custom_org_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
