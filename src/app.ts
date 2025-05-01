import express from "express";
import cors from "cors";
import { Request, Response } from "express";

import { setupMqttService } from "./core/services/station.service";
import { corsOptions, customCors } from "./core/middlewares/cors.middleware";
import { errorHandler } from "./core/middlewares/error-handler.middleware";
import logger from "./core/utils/logger";
import config from "./config/environment.config";
import apiRoutes from "./route";

const app = express();

// middleware
app.use(customCors);
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());

// routes
app.use("/api", apiRoutes);
// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// error handler
app.use(errorHandler);

(async () => {
  try {
    // const mqttService = await setupMqttService();
    logger.info("MQTT service initialized successfully");

    // app.locals.mqttService = mqttService;

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to initialize MQTT service:", error);
    process.exit(1);
  }
})();

export default app;
