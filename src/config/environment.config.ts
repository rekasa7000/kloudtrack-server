import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  AMAZON_HOST: string;
  CERT_DIR: string;
}

const config: Config = {
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "",
  AMAZON_HOST: process.env.AMAZON_HOST || "",
  CERT_DIR: process.env.CERT_DIR || "",
};

export default config;
