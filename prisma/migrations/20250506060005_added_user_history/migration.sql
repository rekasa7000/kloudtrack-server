/*
  Warnings:

  - Added the required column `uploaded_by_user_id` to the `certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issued_by` to the `commands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by_user_id` to the `root_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_user_id` to the `stations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "uploaded_by_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "commands" ADD COLUMN     "issued_by" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "root_certificates" ADD COLUMN     "uploaded_by_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "created_by_user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_by_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_certificates" ADD CONSTRAINT "root_certificates_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
