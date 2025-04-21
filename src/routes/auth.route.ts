import { Request, Response, NextFunction, Router } from "express";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.post(
  "/signin",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.json("Hello world");
  })
);

export default router;
