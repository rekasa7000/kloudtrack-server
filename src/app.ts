import express from "express";
import { errorHandler } from "./middleware/error-handler.middleware";
import { authRouter } from "./routes/auth.route";

const app = express();

app.use(express.json());

// Routes
app.use("/auth", authRouter);

app.use(errorHandler);

export default app;
