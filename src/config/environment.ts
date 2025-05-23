import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || "3000",
  cookie: process.env.COOKIE_NAME || "KLOUDTRACK_COOKIE_JWT",
  jwt: {
    secret: process.env.JWT_SECRET || "",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  aws: {
    region: process.env.AWS_REGION || "",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    iot: {
      endpoint: process.env.AWS_IOT_HOST || "",
      policyName: process.env.AWS_IOT_POLICY_NAME || "",
    },
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || "kloudtrack",
    },
  },
  certificates: {
    dir: process.env.CERTS_DIR || "/certificates",
    rootCaPath: process.env.ROOT_CA_PATH || "/certificates",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
