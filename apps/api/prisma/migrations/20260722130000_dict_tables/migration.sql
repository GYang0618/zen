-- CreateTable
CREATE TABLE "dict_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dict_items" (
    "id" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dict_types_code_key" ON "dict_types"("code");

-- CreateIndex
CREATE INDEX "dict_items_type_code_sort_idx" ON "dict_items"("type_code", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "dict_items_type_code_value_key" ON "dict_items"("type_code", "value");

-- AddForeignKey
ALTER TABLE "dict_items" ADD CONSTRAINT "dict_items_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "dict_types"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed common dict
INSERT INTO "dict_types" ("id", "code", "name", "description", "created_at", "updated_at")
VALUES
  ('cmdicttype000000000000001', 'gender', '性别', '用户性别', NOW(), NOW()),
  ('cmdicttype000000000000002', 'record_status', '记录状态', '通用启用/禁用', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "dict_items" ("id", "type_code", "label", "value", "sort", "status", "created_at", "updated_at")
VALUES
  ('cmdictitem000000000000001', 'gender', '男', 'male', 1, 'active', NOW(), NOW()),
  ('cmdictitem000000000000002', 'gender', '女', 'female', 2, 'active', NOW(), NOW()),
  ('cmdictitem000000000000003', 'gender', '未知', 'unknown', 3, 'active', NOW(), NOW()),
  ('cmdictitem000000000000004', 'record_status', '启用', 'active', 1, 'active', NOW(), NOW()),
  ('cmdictitem000000000000005', 'record_status', '禁用', 'disabled', 2, 'active', NOW(), NOW())
ON CONFLICT ("type_code", "value") DO NOTHING;
