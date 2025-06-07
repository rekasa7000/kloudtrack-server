/*
  Warnings:

  - The primary key for the `system_metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `system_metrics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "system_metrics" DROP CONSTRAINT "system_metrics_pkey",
DROP COLUMN "id",
ADD COLUMN     "system_metrics_id" SERIAL NOT NULL,
ADD CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("system_metrics_id");
