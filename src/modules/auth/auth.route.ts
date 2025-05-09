import { Router } from "express";
import { AuthController } from "../../controllers/auth-controller";
import {
  validateRegister,
  validateLogin,
} from "../../validators/auth-validator";
import { protect } from "../../core/middlewares/auth.middleware";

const router = Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/request-password-reset", AuthController.requestPasswordReset);
router.post("/reset-password", AuthController.resetPassword);
router.get("/profile", protect, AuthController.getProfile);

export default router;
