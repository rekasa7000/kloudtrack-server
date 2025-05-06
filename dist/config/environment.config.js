"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "",
    AMAZON_HOST: process.env.AMAZON_HOST || "",
    CERT_DIR: process.env.CERT_DIR || "",
};
exports.default = config;
