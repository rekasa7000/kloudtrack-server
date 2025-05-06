/*
  Warnings:

  - You are about to drop the `sensor_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "sensor_data";

-- CreateTable
CREATE TABLE "telemetry" (
    "sensor_data_id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "heat_index" DOUBLE PRECISION,
    "wind_direction" DOUBLE PRECISION,
    "wind_speed" DOUBLE PRECISION,
    "precipitation" DOUBLE PRECISION,
    "uv_index" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "light_intensity" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("sensor_data_id")
);
