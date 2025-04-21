import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid, hostname",
    },
  },
  level: process.env.NODE_ENV === "production" ? "infor" : "debug",
});

export default logger;
