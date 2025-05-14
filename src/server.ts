import "reflect-metadata";
import app from "./app";
import config from "./config/environment.config";
import logger from "./core/utils/logger";

app.listen(config.PORT, async () => {
  logger.info(`Server running on port ${config.PORT}`);
});
