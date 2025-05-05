/*
  Warnings:

  - You are about to drop the column `certificateId` on the `stations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serial_code]` on the table `stations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `certificate_status` to the `certificates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "certificate_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "aws_certificate_arn" TEXT,
ADD COLUMN     "aws_certificate_id" TEXT,
ADD COLUMN     "certificate_status" "certificate_status_enum" NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "fingerprint" TEXT;

-- AlterTable
ALTER TABLE "stations" DROP COLUMN "certificateId",
ALTER COLUMN "activated_at" DROP NOT NULL;

-- CreateTable
CREATE TABLE "root_certificates" (
    "root_certificate_id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "certificate_status" "certificate_status_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "root_certificates_pkey" PRIMARY KEY ("root_certificate_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_serial_code_key" ON "stations"("serial_code");
