import { Request, Response, NextFunction, Router } from "express";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { checkAuth, login } from "./auth.controller";
import { protect } from "../../core/middlewares/auth.middleware";
import { validateRequest } from "../../core/middlewares/validation.middleware";
import { SignInSchema } from "./auth.schema";

const router = Router();

router.post("/login", validateRequest(SignInSchema), login);
router.get("/check-auth", protect, checkAuth);

export default router;
