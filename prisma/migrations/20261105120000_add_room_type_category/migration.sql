-- AlterTable
ALTER TABLE "room_types" ADD COLUMN "category_id" UUID;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "room_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
