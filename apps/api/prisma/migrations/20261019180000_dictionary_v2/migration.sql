CREATE TABLE "dict_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dict_folders_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dict_types" ADD COLUMN "folder_id" TEXT;

CREATE INDEX "dict_folders_parent_id_idx" ON "dict_folders"("parent_id");
CREATE INDEX "dict_types_folder_id_idx" ON "dict_types"("folder_id");

ALTER TABLE "dict_folders" ADD CONSTRAINT "dict_folders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "dict_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dict_types" ADD CONSTRAINT "dict_types_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "dict_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
