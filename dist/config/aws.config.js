"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET_NAME = exports.s3Client = exports.DEFAULT_AWS_IOT_CONFIG = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.DEFAULT_AWS_IOT_CONFIG = {
    host: process.env.AWS_IOT_HOST || "",
    port: parseInt(process.env.AWS_IOT_PORT || "8883"),
    protocol: process.env.AWS_IOT_PROTOCOL || "mqtts",
    reconnectPeriod: parseInt(process.env.AWS_IOT_RECONNECT_PERIOD || "5000"),
};
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
exports.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "kloudtrack";
