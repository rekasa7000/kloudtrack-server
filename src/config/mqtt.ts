export const mqttConfig = {
  keyPath: process.env.AWS_IOT_KEY_PATH || "./certs/private.key",
  certPath: process.env.AWS_IOT_CERT_PATH || "./certs/certificate.pem.crt",
  caPath: process.env.AWS_IOT_CA_PATH || "./certs/AmazonRootCA1.pem",
  clientId:
    process.env.AWS_IOT_CLIENT_ID ||
    `server-${Math.random().toString(16).substring(2, 10)}`,
  host:
    process.env.AWS_IOT_HOST ||
    "your-aws-iot-endpoint.iot.region.amazonaws.com",
  port: Number(process.env.AWS_IOT_PORT) || 8883,
  protocol: (process.env.AWS_IOT_PROTOCOL || "mqtts") as "mqtts" | "wss",
  reconnectPeriod: Number(process.env.AWS_IOT_RECONNECT_PERIOD) || 5000,
};
