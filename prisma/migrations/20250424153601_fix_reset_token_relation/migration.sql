/*
  Warnings:

  - You are about to drop the column `organization_id` on the `stations` table. All the data in the column will be lost.

*/
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
ALTER TABLE "stations" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "organization_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "reset_tokens" (
    "reset_token_id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("reset_token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "reset_tokens" ADD CONSTRAINT "reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
