-- AlterTable
ALTER TABLE "dict_items" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "dict_types" ADD COLUMN     "is_starred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'business';
