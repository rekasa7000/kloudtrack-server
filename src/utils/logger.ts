import pino from "pino";
import fs from "fs";
import config from "../config/config";

const logStream = fs.createWriteStream("./app.log", { flags: "a" });

const consoleTransport = pino.transport({
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
  },
});

const localTimeFormatter = {
  time: () =>
    `,"time":"${new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      hour12: true,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}"`,
};
const logger = pino(
  {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    timestamp: localTimeFormatter.time,
    messageKey: "description",
  },

  pino.multistream([{ stream: logStream }, { stream: consoleTransport }])
);

export default logger;
