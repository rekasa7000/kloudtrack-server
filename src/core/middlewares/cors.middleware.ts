import express from "express";
import cors from "cors";
import { Request, Response, NextFunction } from "express";

interface CorsConfig {
  allowedOrigins: string[];
  allowApiKeyOrigins: boolean;
  apiKeyHeader: string;
}

const corsConfig: CorsConfig = {
  allowedOrigins: ["http://localhost:5173"],
  allowApiKeyOrigins: true,
  apiKeyHeader: "x-api-key",
};

export const customCors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const apiKey = req.headers[corsConfig.apiKeyHeader.toLowerCase()] as
    | string
    | undefined;

  if (corsConfig.allowApiKeyOrigins && apiKey) {
    // * VALIDATE API KEY HERE. FOR NOW, ALLOW ALL
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
    return next();
  }

  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
  }

  next();
};

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsConfig.allowApiKeyOrigins) {
      return callback(null, true);
    }

    if (corsConfig.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", corsConfig.apiKeyHeader],
  maxAge: 1000 * 60 * 60 * 24,
};

const app = express();
