-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- AlterTable
-- Existing users become STAFF with no property, so they cannot sign in until an
-- administrator assigns them to a property (or makes them ADMIN). Nobody is
-- silently granted admin access.
ALTER TABLE "users"
    ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    ADD COLUMN "property_id" UUID;

-- CreateIndex
CREATE INDEX "users_property_id_idx" ON "users"("property_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
