import { Request, Response, NextFunction, Router } from "express";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";

const router = Router();

router.post(
  "/signin",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.json("Hello world");
  })
);

export default router;
