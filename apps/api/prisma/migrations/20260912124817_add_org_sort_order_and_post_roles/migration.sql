-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "post_roles" (
    "post_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_roles_pkey" PRIMARY KEY ("post_id","role_id")
);

-- CreateIndex
CREATE INDEX "post_roles_role_id_idx" ON "post_roles"("role_id");

-- CreateIndex
CREATE INDEX "organizations_sort_order_idx" ON "organizations"("sort_order");

-- AddForeignKey
ALTER TABLE "post_roles" ADD CONSTRAINT "post_roles_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_roles" ADD CONSTRAINT "post_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
