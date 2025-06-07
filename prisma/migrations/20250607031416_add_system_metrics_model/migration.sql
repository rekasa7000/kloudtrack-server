-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpu_usage_percent" DOUBLE PRECISION NOT NULL,
    "cpu_load_1_min" DOUBLE PRECISION NOT NULL,
    "cpu_load_5_min" DOUBLE PRECISION NOT NULL,
    "cpu_load_15_min" DOUBLE PRECISION NOT NULL,
    "cpu_temperature" DOUBLE PRECISION,
    "total_memory_gb" DOUBLE PRECISION NOT NULL,
    "used_memory_gb" DOUBLE PRECISION NOT NULL,
    "free_memory_gb" DOUBLE PRECISION NOT NULL,
    "memory_usage_percent" DOUBLE PRECISION NOT NULL,
    "total_disk_gb" DOUBLE PRECISION NOT NULL,
    "used_disk_gb" DOUBLE PRECISION NOT NULL,
    "free_disk_gb" DOUBLE PRECISION NOT NULL,
    "disk_usage_percent" DOUBLE PRECISION NOT NULL,
    "network_rx_bytes" BIGINT,
    "network_tx_bytes" BIGINT,
    "uptime" BIGINT NOT NULL,
    "process_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);
