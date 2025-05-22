-- CreateEnum
CREATE TYPE "station_type_enum" AS ENUM ('WEATHERSTATION', 'RAINGAUGE', 'RIVERLEVEL', 'COASTALLEVEL');

-- CreateEnum
CREATE TYPE "certificate_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "problem_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "command_status_enum" AS ENUM ('PENDING', 'DELIVERED', 'EXECUTED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "user_name" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "role" "user_role_enum" NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "profile_picture" TEXT,
    "created_by_user_id" INTEGER,
    "password_changed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "reset_tokens" (
    "reset_token_id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("reset_token_id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "organization_id" SERIAL NOT NULL,
    "organization_name" TEXT NOT NULL,
    "description" TEXT,
    "display_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_organization_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_organization_id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "api_key_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "key_value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("api_key_id")
);

-- CreateTable
CREATE TABLE "stations" (
    "station_id" SERIAL NOT NULL,
    "organizationId" INTEGER,
    "station_name" TEXT NOT NULL,
    "station_type" "station_type_enum" NOT NULL,
    "location" JSONB NOT NULL,
    "barangay" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "serial_code" TEXT NOT NULL,
    "elevation" DOUBLE PRECISION,
    "station_picture" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "activated_at" TIMESTAMP(3),
    "firmware_version" TEXT NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stations_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "certificate_id" SERIAL NOT NULL,
    "key_path" TEXT NOT NULL,
    "key_location" TEXT,
    "cert_path" TEXT NOT NULL,
    "cert_location" TEXT,
    "aws_certificate_id" TEXT,
    "aws_certificate_arn" TEXT,
    "certificate_status" "certificate_status_enum" NOT NULL,
    "station_id" INTEGER NOT NULL,
    "fingerprint" TEXT,
    "uploaded_by_user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("certificate_id")
);

-- CreateTable
CREATE TABLE "root_certificates" (
    "root_certificate_id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "location" TEXT,
    "version" TEXT NOT NULL,
    "certificate_status" "certificate_status_enum" NOT NULL,
    "uploaded_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "root_certificates_pkey" PRIMARY KEY ("root_certificate_id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "telemetry_id" SERIAL NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("telemetry_id")
);

-- CreateTable
CREATE TABLE "commands" (
    "command_id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "issued_by" INTEGER NOT NULL,
    "command" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "commands_pkey" PRIMARY KEY ("command_id")
);

-- CreateTable
CREATE TABLE "problem_reports" (
    "problem_report_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "issued_by" INTEGER,
    "status" "problem_status_enum" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_reports_pkey" PRIMARY KEY ("problem_report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "stations_station_name_key" ON "stations"("station_name");

-- CreateIndex
CREATE UNIQUE INDEX "stations_serial_code_key" ON "stations"("serial_code");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_station_id_key" ON "certificates"("station_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_tokens" ADD CONSTRAINT "reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_certificates" ADD CONSTRAINT "root_certificates_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
