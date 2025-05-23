import pino from "pino";
import { config } from "../../config/environment";
import fs from "fs";
import path from "path";
import type { Logger } from "pino";

const logsDir = "logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const prettyConfig = {
  colorize: true,
  translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
  ignore: "pid,hostname",
  messageFormat: "🚀 {msg}",
  levelFirst: true,
  crlf: false,
  errorLikeObjectKeys: ["err", "error"],
};

interface WinstonCompatibleLogger {
  error(message: any, meta?: any): void;
  warn(message: any, meta?: any): void;
  info(message: any, meta?: any): void;
  debug(message: any, meta?: any): void;
  verbose(message: any, meta?: any): void;
  silly(message: any, meta?: any): void;
  log(level: string, message: any, meta?: any): void;
  child(bindings: Record<string, any>): Logger;
  isLevelEnabled(level: string): boolean;
}

type WinstonLevel = "error" | "warn" | "info" | "debug" | "verbose" | "silly";
type PinoLevel = "error" | "warn" | "info" | "debug" | "trace";

const levelMapping: Record<WinstonLevel, PinoLevel> = {
  error: "error",
  warn: "warn",
  info: "info",
  debug: "debug",
  verbose: "trace",
  silly: "trace",
} as const;

const pinoLevel: PinoLevel = levelMapping[config.logging.level as WinstonLevel] || "info";

const streams = [
  {
    level: "error",
    stream: pino.destination({
      dest: path.join(logsDir, "error.log"),
      sync: false,
      mkdir: true,
    }),
  },
  {
    level: pinoLevel,
    stream: pino.destination({
      dest: path.join(logsDir, "combined.log"),
      sync: false,
      mkdir: true,
    }),
  },
];

if (config.env !== "production") {
  streams.push({
    level: pinoLevel,
    stream: pino.transport({
      target: "pino-pretty",
      options: prettyConfig,
    }),
  });
}

const baseLogger = pino(
  {
    level: pinoLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  },
  pino.multistream(streams)
);

const logger: WinstonCompatibleLogger = {
  error: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.error({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.error({ ...message, ...meta });
    } else {
      baseLogger.error({ ...meta }, String(message));
    }
  },

  warn: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.warn({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.warn({ ...message, ...meta });
    } else {
      baseLogger.warn({ ...meta }, String(message));
    }
  },

  info: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.info({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.info({ ...message, ...meta });
    } else {
      baseLogger.info({ ...meta }, String(message));
    }
  },

  debug: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.debug({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.debug({ ...message, ...meta });
    } else {
      baseLogger.debug({ ...meta }, String(message));
    }
  },

  verbose: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.trace({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.trace({ ...message, ...meta });
    } else {
      baseLogger.trace({ ...meta }, String(message));
    }
  },

  silly: (message: any, meta: any = {}): void => {
    if (typeof message === "object" && message instanceof Error) {
      baseLogger.trace({ err: message, ...meta });
    } else if (typeof message === "object") {
      baseLogger.trace({ ...message, ...meta });
    } else {
      baseLogger.trace({ ...meta }, String(message));
    }
  },

  log: (level: string, message: any, meta: any = {}): void => {
    const pinoMethod = levelMapping[level as WinstonLevel] || level;
    const logMethod = logger[pinoMethod as keyof WinstonCompatibleLogger];
    if (typeof logMethod === "function") {
      (logMethod as any)(message, meta);
    }
  },

  child: (bindings: Record<string, any>): Logger => baseLogger.child(bindings),

  isLevelEnabled: (level: string): boolean => {
    return baseLogger.isLevelEnabled(levelMapping[level as WinstonLevel] || (level as PinoLevel));
  },
};

export { logger };
