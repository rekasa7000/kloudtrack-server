import express, { NextFunction } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { corsOptions, customCors } from "./core/middlewares/cors.middleware";
import { errorHandler } from "./core/middlewares/error-handler.middleware";
import apiRoutes from "./route";
import { AppError } from "./core/utils/error";

const app = express();

// middleware
app.use(customCors);
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/", apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// error handler
app.use(errorHandler);
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError("Not Found", 404));
});

// Export app without starting the server here
export default app;
