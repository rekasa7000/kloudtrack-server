import express from "express";
import cors from "cors";
import { Request, Response } from "express";
import { errorHandler } from "./middleware/error-handler.middleware";
import { corsOptions, customCors } from "./middleware/cors.middleware";
import router from "./routes";
import logger from "./utils/logger";
import { setupMqttService } from "./services/mqtt/setup";
import config from "./config/config";

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

(async () => {
  try {
    const mqttService = await setupMqttService();
    logger.info("MQTT service initialized successfully");

    app.locals.mqttService = mqttService;

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to initialize MQTT service:", error);
    process.exit(1);
  }
})();

export default app;
