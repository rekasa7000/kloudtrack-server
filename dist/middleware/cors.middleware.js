"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = exports.customCors = void 0;
const express_1 = __importDefault(require("express"));
const corsConfig = {
    allowedOrigins: ["http://localhost:5173"],
    allowApiKeyOrigins: true,
    apiKeyHeader: "x-api-key",
};
const customCors = (req, res, next) => {
    const origin = req.headers.origin;
    const apiKey = req.headers[corsConfig.apiKeyHeader.toLowerCase()];
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
exports.customCors = customCors;
exports.corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
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
const app = (0, express_1.default)();
