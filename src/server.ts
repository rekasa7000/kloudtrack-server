import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.start(PORT).catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
