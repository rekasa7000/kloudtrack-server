import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database: {
    url: process.env.DATABASE_URL,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    iot: {
      endpoint: process.env.AWS_IOT_ENDPOINT,
      policyName: process.env.AWS_IOT_POLICY_NAME,
    },
  },
  certificates: {
    dir: process.env.CERTS_DIR,
    rootCaPath: process.env.ROOT_CA_PATH,
  },
  logging: {
    level: process.env.LOG_LEVEL,
  },
};
