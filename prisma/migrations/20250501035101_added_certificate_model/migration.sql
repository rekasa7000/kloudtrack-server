/*
  Warnings:

  - You are about to drop the column `organization_id` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `certificateId` to the `stations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serial_code` to the `stations` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `station_type` on the `stations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "station_type_enum" AS ENUM ('WEATHERSTATION', 'RAINGAUGE', 'RIVERLEVEL', 'COASTALLEVEL');

-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "problem_reports" DROP CONSTRAINT "problem_reports_issued_by_fkey";

-- DropForeignKey
ALTER TABLE "sensor_data" DROP CONSTRAINT "sensor_data_station_id_fkey";

-- DropForeignKey
ALTER TABLE "stations" DROP CONSTRAINT "stations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- AlterTable
ALTER TABLE "problem_reports" ALTER COLUMN "issued_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sensor_data" ADD COLUMN     "distance" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "stations" DROP COLUMN "organization_id",
DROP COLUMN "password",
ADD COLUMN     "certificateId" INTEGER NOT NULL,
ADD COLUMN     "serial_code" TEXT NOT NULL,
DROP COLUMN "station_type",
ADD COLUMN     "station_type" "station_type_enum" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "organization_id";

-- CreateTable
CREATE TABLE "certificates" (
    "certificate_id" SERIAL NOT NULL,
    "key_path" TEXT NOT NULL,
    "cert_path" TEXT NOT NULL,
    "station_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("certificate_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_station_id_key" ON "certificates"("station_id");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
