export interface SystemMetrics {
  cpu: {
    usagePercent: number;
    load1Min: number;
    load5Min: number;
    load15Min: number;
    temperature?: number;
  };
  memory: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  disk: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  network?: {
    rxBytes: bigint;
    txBytes: bigint;
  };
  system: {
    uptime: bigint;
    processCount: number;
  };
}

export interface HealthMetricsResponse {
  id: string;
  timestamp: Date;
  cpu: {
    usagePercent: number;
    load1Min: number;
    load5Min: number;
    load15Min: number;
    temperature?: number;
  };
  memory: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  disk: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  network?: {
    rxBytes: string;
    txBytes: string;
  };
  system: {
    uptime: string;
    processCount: number;
  };
}

export interface TimeRangeQuery {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
