-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "grade" TEXT,
ADD COLUMN     "headcount" INTEGER NOT NULL DEFAULT 1;
