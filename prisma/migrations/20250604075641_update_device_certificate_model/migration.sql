/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `firmwares` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firmware_serial` to the `firmwares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `firmwares` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `firmware_version` on the `stations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "issuer" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "valid_since" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "firmwares" ADD COLUMN     "description" TEXT,
ADD COLUMN     "firmware_serial" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stations" DROP COLUMN "firmware_version",
ADD COLUMN     "firmware_version" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "firmwares_title_key" ON "firmwares"("title");

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_firmware_version_fkey" FOREIGN KEY ("firmware_version") REFERENCES "firmwares"("firmware_id") ON DELETE RESTRICT ON UPDATE CASCADE;
