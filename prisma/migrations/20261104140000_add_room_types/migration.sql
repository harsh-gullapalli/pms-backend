-- CreateEnum
CREATE TYPE "RoomTypeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "room_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "room_count" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "base_rate" DECIMAL(10,2) NOT NULL,
    "status" "RoomTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_types_name_key" ON "room_types"("name");
