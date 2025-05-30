/*
  Warnings:

  - You are about to drop the column `barangay` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `stations` table. All the data in the column will be lost.
  - Added the required column `address` to the `stations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `stations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stations" DROP COLUMN "barangay",
DROP COLUMN "province",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "firmwares" (
    "firmware_id" SERIAL NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "path" TEXT NOT NULL,
    "location" TEXT,
    "version" TEXT NOT NULL,

    CONSTRAINT "firmwares_pkey" PRIMARY KEY ("firmware_id")
);

-- AddForeignKey
ALTER TABLE "firmwares" ADD CONSTRAINT "firmwares_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
