-- AlterEnum
ALTER TYPE "RoleDataScope" ADD VALUE 'organization_only';

-- AlterTable
ALTER TABLE "job_records" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stored_files" ALTER COLUMN "updated_at" DROP DEFAULT;
