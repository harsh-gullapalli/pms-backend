-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_code_key" ON "properties"("code");

-- Room types created before properties existed are moved under a placeholder
-- property so the new column can be NOT NULL. Rename or replace it afterwards.
INSERT INTO "properties" ("id", "name", "code", "city", "country", "updated_at")
SELECT gen_random_uuid(), 'Default Property', 'DEFAULT', 'Unknown', 'Unknown', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "room_types");

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN "property_id" UUID;

UPDATE "room_types"
SET "property_id" = (SELECT "id" FROM "properties" WHERE "code" = 'DEFAULT');

ALTER TABLE "room_types" ALTER COLUMN "property_id" SET NOT NULL;

-- Names are now unique per property rather than globally.
DROP INDEX "room_types_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "room_types_property_id_name_key" ON "room_types"("property_id", "name");

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
