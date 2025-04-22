import express from "express";
import cors from "cors";

import { Request, Response } from "express";

import { errorHandler } from "./middleware/error-handler.middleware";
import { corsOptions, customCors } from "./middleware/cors.middleware";

import router from "./routes";

const app = express();

app.use(customCors);
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());

app.use(router);
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

app.use(errorHandler);

export default app;
