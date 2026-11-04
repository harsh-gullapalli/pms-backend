-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'RESORT', 'VILLA', 'MOTEL', 'APARTMENT');

-- AlterTable
-- Existing properties are treated as hotels; the default is dropped again so
-- new rows must state their type.
ALTER TABLE "properties"
    ADD COLUMN "type" "PropertyType" NOT NULL DEFAULT 'HOTEL',
    ADD COLUMN "state" TEXT,
    ADD COLUMN "postal_code" TEXT,
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "email" TEXT,
    ADD COLUMN "website" TEXT;

ALTER TABLE "properties" ALTER COLUMN "type" DROP DEFAULT;
