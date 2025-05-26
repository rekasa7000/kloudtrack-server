import app from "./app";
import { config } from "./config/environment";

app.start(config.port).catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
