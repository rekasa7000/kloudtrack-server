import { S3Client } from "@aws-sdk/client-s3";

export const DEFAULT_AWS_IOT_CONFIG = {
  host: process.env.AWS_IOT_HOST || "",
  port: parseInt(process.env.AWS_IOT_PORT || "8883"),
  protocol: (process.env.AWS_IOT_PROTOCOL as "mqtts" | "wss") || "mqtts",
  reconnectPeriod: parseInt(process.env.AWS_IOT_RECONNECT_PERIOD || "5000"),
};

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "kloudtrack";
