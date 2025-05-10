-- CreateEnum
CREATE TYPE "command_status_enum" AS ENUM ('PENDING', 'DELIVERED', 'EXECUTED', 'FAILED');

-- CreateTable
CREATE TABLE "commands" (
    "command_id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "command" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "commands_pkey" PRIMARY KEY ("command_id")
);

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
