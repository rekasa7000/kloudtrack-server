// src/index.ts
import express from "express";
import cors from "cors";
import { Request, Response } from "express";

import { errorHandler } from "./middleware/error-handler.middleware";
import { corsOptions, customCors } from "./middleware/cors.middleware";
import router from "./routes";
import logger from "./utils/logger";
import { setupMqttService } from "./services/mqtt/setup";

const app = express();

// middleware
app.use(customCors);
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());

// routes
app.use(router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// error handler
app.use(errorHandler);

// init MQTT service
const mqttService = setupMqttService();

// Graceful shutdown handler
const gracefulShutdown = () => {
  logger.info("Shutting down server...");
  mqttService.disconnect();
  process.exit(0);
};

// shutdown handlers
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
