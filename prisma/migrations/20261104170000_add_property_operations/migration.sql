-- "email" becomes the general inquiries address; keep existing values.
ALTER TABLE "properties" RENAME COLUMN "email" TO "general_email";

-- AlterTable
-- default_currency is required, so existing rows are backfilled with USD and
-- the default is dropped again; update real properties to their own currency.
ALTER TABLE "properties"
    ADD COLUMN "description" TEXT,
    ADD COLUMN "front_desk_phone" TEXT,
    ADD COLUMN "emergency_contact" TEXT,
    ADD COLUMN "reservations_email" TEXT,
    ADD COLUMN "check_in_time" TEXT NOT NULL DEFAULT '14:00',
    ADD COLUMN "check_out_time" TEXT NOT NULL DEFAULT '11:00',
    ADD COLUMN "default_currency" TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN "number_of_floors" INTEGER,
    ADD COLUMN "total_rooms" INTEGER;

ALTER TABLE "properties" ALTER COLUMN "default_currency" DROP DEFAULT;
